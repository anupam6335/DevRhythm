const axios = require('axios');
const BaseCodeExecutionProvider = require('./base.provider');

class OnlineCompilerProvider extends BaseCodeExecutionProvider {
  constructor(apiUrl, apiKey, timeout = 30000) {
    super();
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.isFirstLog = true;
  }

  mapLanguage(language) {
    const map = {
      cpp: 'g++-15',
      python: 'python-3.14',
      java: 'openjdk-25',
      javascript: 'nodejs',
    };
    const mapped = map[language];
    if (!mapped) {
      throw new Error(`Unsupported language for onlinecompiler.io: ${language}`);
    }
    return mapped;
  }

  async execute({ language, code, stdin }) {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error('OnlineCompiler API URL or API key not configured');
    }

    const finalCode = code;
    const compiler = this.mapLanguage(language);
    const payload = {
      compiler: compiler,
      code: finalCode,
      input: stdin || '',
    };

    const url = `${this.apiUrl}/api/run-code-sync/`;
    
    if (this.isFirstLog) {
      this.isFirstLog = false;
      // Optional debug log – can be removed in production
      // console.log('[OnlineCompilerProvider] First execution, language:', language);
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
      });

      const data = response.data;
      return {
        stdout: data.output || '',
        stderr: data.error || '',
        exitCode: data.exit_code !== undefined ? data.exit_code : (data.error ? 1 : 0),
      };
    } catch (error) {
      // Log full error details for debugging
      console.error('[OnlineCompilerProvider] Execution error:', {
        language,
        url,
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        requestError: error.request ? 'Request made but no response received' : undefined,
      });

      let stderr = '';
      let exitCode = 1;

      // Try to extract meaningful error from API response
      if (error.response && error.response.data) {
        const apiData = error.response.data;
        if (typeof apiData === 'object') {
          stderr = apiData.message || apiData.error || apiData.stderr || apiData.output;
          if (apiData.details) stderr += `\nDetails: ${apiData.details}`;
        } else if (typeof apiData === 'string') {
          stderr = apiData;
        }
        if (!stderr) {
          stderr = `API error (${error.response.status}): ${error.response.statusText}`;
        }
      } else if (error.request) {
        stderr = `Network error: ${error.message}`;
      } else {
        stderr = `Unexpected error: ${error.message}`;
      }

      // Clean up stderr to avoid extremely long strings
      if (stderr.length > 2000) {
        stderr = stderr.substring(0, 2000) + '... (truncated)';
      }

      return {
        stdout: '',
        stderr: stderr || 'Execution service error',
        exitCode,
      };
    }
  }

  async executeBatch({ language, code, testCases }) {
    const promises = testCases.map(tc =>
      this.execute({ language, code, stdin: tc.stdin })
    );
    return Promise.all(promises);
  }
}

module.exports = OnlineCompilerProvider;