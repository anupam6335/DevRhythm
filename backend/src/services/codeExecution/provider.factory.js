const config = require('../../config');
const Judge0Provider = require('./judge0.provider');

class CodeExecutionProviderFactory {
  static createProvider() {
    const provider = config.codeExecution.provider;
    if (provider === 'judge0') {
      return new Judge0Provider(
        config.codeExecution.judge0.apiUrl,
        config.codeExecution.judge0.cpuTimeLimit,
        config.codeExecution.judge0.memoryLimit,
      );
    }
    throw new Error(`Unsupported code execution provider: ${provider}`);
  }
}

module.exports = CodeExecutionProviderFactory;