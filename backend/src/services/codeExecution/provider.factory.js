/**
 * src/services/codeExecution/provider.factory.js
 *
 * Factory for creating code execution providers based on configuration.
 * Supports judge0, onlinecompiler, and local (sandboxed) execution.
 */

const config = require('../../config');
const Judge0Provider = require('./judge0.provider');
const OnlineCompilerProvider = require('./onlinecompiler.provider');
const LocalProvider = require('./local.provider'); // To be created in File 4

class CodeExecutionProviderFactory {
  static createProvider() {
    const provider = config.codeExecution.provider;
    const localConfig = config.localExecution || {};

    if (provider === 'local') {
      if (!localConfig.enabled) {
        console.warn('[ProviderFactory] Local execution is disabled in config, falling back to onlinecompiler');
        return new OnlineCompilerProvider(
          config.codeExecution.onlineCompiler.apiUrl,
          config.codeExecution.onlineCompiler.apiKey,
          config.codeExecution.onlineCompiler.timeout,
        );
      }
      console.log('[ProviderFactory] Using local execution provider (sandboxed)');
      return new LocalProvider({
        sandbox: localConfig.sandbox || 'isolate',
        cpuTimeLimit: localConfig.cpuTimeLimit || 2,
        memoryLimitKB: localConfig.memoryLimitKB || 256000,
        wallTimeLimit: localConfig.wallTimeLimit || 5,
        outputLimitKB: localConfig.outputLimitKB || 1024,
        cxxCompiler: localConfig.cxxCompiler || 'g++',
        pythonExecutable: localConfig.pythonExecutable || 'python3',
      });
    }

    if (provider === 'judge0') {
      console.log('[ProviderFactory] Using Judge0 provider');
      return new Judge0Provider(
        config.codeExecution.judge0.apiUrl,
        config.codeExecution.judge0.cpuTimeLimit,
        config.codeExecution.judge0.memoryLimit,
      );
    }

    // Default: onlinecompiler (also handles 'onlinecompiler' case)
    console.log('[ProviderFactory] Using OnlineCompiler provider');
    return new OnlineCompilerProvider(
      config.codeExecution.onlineCompiler.apiUrl,
      config.codeExecution.onlineCompiler.apiKey,
      config.codeExecution.onlineCompiler.timeout,
    );
  }
}

module.exports = CodeExecutionProviderFactory;