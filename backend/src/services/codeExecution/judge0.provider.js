const axios = require('axios');
const BaseCodeExecutionProvider = require('./base.provider');

const LANGUAGE_IDS = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
};

const TEMPLATES = {
cpp: `{{USER_CODE}}`,
  python: `
{{USER_CODE}}

if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read()
    output = solve(input_data)
    sys.stdout.write(output)
`,
  java: `{{USER_CODE}}`,
  javascript: `
const fs = require('fs');

function solve(user_input) {
    // --- USER CODE START ---
{{USER_CODE}}
    // --- USER CODE END ---
}

const input = fs.readFileSync(0, 'utf-8');
const output = solve(input);
process.stdout.write(output);
`,
};

class Judge0Provider extends BaseCodeExecutionProvider {
  constructor(apiUrl, cpuTimeLimit, memoryLimit) {
    super();
    this.apiUrl = apiUrl;
    this.cpuTimeLimit = cpuTimeLimit;
    this.memoryLimit = memoryLimit;
  }

  async execute({ language, code, stdin }) {
    const langId = LANGUAGE_IDS[language];
    if (!langId) throw new Error(`Unsupported language: ${language}`);
    const template = TEMPLATES[language];
    if (!template) throw new Error(`Template missing for language: ${language}`);
    const sourceCode = template.replace('{{USER_CODE}}', this._indentCode(code, language !== 'python'));

    const payload = {
      source_code: sourceCode,
      language_id: langId,
      stdin: stdin || '',
      cpu_time_limit: this.cpuTimeLimit,
      memory_limit: this.memoryLimit,
    };

    const url = `${this.apiUrl}/submissions?wait=true&fields=stdout,stderr,status`;
    // Increase timeout for Java (30s) to accommodate JVM startup and isolation overhead
    const timeout = language === 'java' ? 50000 : 30000;
    const response = await axios.post(url, payload, {
      timeout: Math.max(timeout, (this.cpuTimeLimit + 2) * 1000),
    });
    const result = response.data;
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status?.id === 3 ? 0 : 1,
    };
  }

  async executeBatch({ language, code, testCases }) {
    const langId = LANGUAGE_IDS[language];
    if (!langId) throw new Error(`Unsupported language: ${language}`);
    const template = TEMPLATES[language];
    if (!template) throw new Error(`Template missing for language: ${language}`);
    const sourceCode = template.replace('{{USER_CODE}}', this._indentCode(code, language !== 'python'));

    // Increase timeout for Java (30s) to accommodate JVM startup and isolation overhead
    const timeout = language === 'java' ? 50000 : 30000;

    const promises = testCases.map(async (tc) => {
      const payload = {
        source_code: sourceCode,
        language_id: langId,
        stdin: tc.stdin,
        cpu_time_limit: this.cpuTimeLimit,
        memory_limit: this.memoryLimit,
      };
      const url = `${this.apiUrl}/submissions?wait=true&fields=stdout,stderr,status`;
      const response = await axios.post(url, payload, {
        timeout: Math.max(timeout, (this.cpuTimeLimit + 2) * 1000),
      });
      const result = response.data;
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.status?.id === 3 ? 0 : 1,
      };
    });

    return Promise.all(promises);
  }

  _indentCode(code, shouldIndent) {
    if (!shouldIndent) return code;
    const indent = ' '.repeat(4);
    return code.split('\n').map(line => line ? indent + line : line).join('\n');
  }
}

module.exports = Judge0Provider;