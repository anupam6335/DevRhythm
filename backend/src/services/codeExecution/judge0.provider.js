const axios = require('axios');
const BaseCodeExecutionProvider = require('./base.provider');

const LANGUAGE_IDS = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
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
    
    const payload = {
      source_code: code,
      language_id: langId,
      stdin: stdin || '',
      cpu_time_limit: this.cpuTimeLimit,
      memory_limit: this.memoryLimit,
    };

    const url = `${this.apiUrl}/submissions?wait=true&fields=stdout,stderr,status`;
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
    const promises = testCases.map(tc => this.execute({ language, code, stdin: tc.stdin }));
    return Promise.all(promises);
  }
}

module.exports = Judge0Provider;