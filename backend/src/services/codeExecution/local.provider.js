/**
 * src/services/codeExecution/local.provider.js
 *
 * Local code execution provider using sandbox (isolate/nsjail).
 * Supports Python and C++ with resource limits.
 */

const fs = require('fs').promises;
const path = require('path');
const { runInSandbox } = require('../../utils/sandbox');
const BaseCodeExecutionProvider = require('./base.provider');
const { createTempDir, cleanup } = require('./tempFileManager');

class LocalProvider extends BaseCodeExecutionProvider {
  constructor(options = {}) {
    super();
    this.sandbox = options.sandbox || 'isolate';
    this.cpuTimeLimit = options.cpuTimeLimit || 2;
    this.memoryLimitKB = options.memoryLimitKB || 256000;
    this.wallTimeLimit = options.wallTimeLimit || 5;
    this.outputLimitKB = options.outputLimitKB || 1024;
    this.cxxCompiler = options.cxxCompiler || 'g++';
    this.pythonExecutable = options.pythonExecutable || 'python3';
  }

  /**
   * Execute a single test case.
   * @param {Object} params
   * @param {string} params.language - 'python' or 'cpp'
   * @param {string} params.code - Full generated wrapper code (ready to run)
   * @param {string} params.stdin - Input for the test case
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  async execute({ language, code, stdin }) {
    // For single test case, we can use the batch method with one test case
    const results = await this.executeBatch({ language, code, testCases: [{ stdin }] });
    return results[0];
  }

  /**
   * Execute multiple test cases.
   * @param {Object} params
   * @param {string} params.language - 'python' or 'cpp'
   * @param {string} params.code - Full generated wrapper code
   * @param {Array<{stdin: string}>} params.testCases
   * @returns {Promise<Array<{stdout: string, stderr: string, exitCode: number}>>}
   */
  async executeBatch({ language, code, testCases }) {
    if (!testCases || testCases.length === 0) {
      return [];
    }

    // Create a temporary directory for this batch
    const tempDir = await createTempDir();
    try {
      let executablePath = null;
      let runCommand = null;
      let runArgs = [];

      if (language === 'python') {
        // Write the code to a .py file
        const scriptPath = path.join(tempDir, 'solution.py');
        await fs.writeFile(scriptPath, code, 'utf8');
        runCommand = this.pythonExecutable;
        runArgs = [scriptPath];
      } else if (language === 'cpp') {
        // Write code to a .cpp file
        const sourcePath = path.join(tempDir, 'solution.cpp');
        await fs.writeFile(sourcePath, code, 'utf8');
        const outputPath = path.join(tempDir, 'solution');
        // Compile
        const compileResult = await this._compileCpp(sourcePath, outputPath, tempDir);
        if (compileResult.stderr) {
          // Compilation failed – return the same error for all test cases
          return testCases.map(() => ({
            stdout: '',
            stderr: compileResult.stderr,
            exitCode: 1,
          }));
        }
        executablePath = outputPath;
        runCommand = executablePath;
        runArgs = [];
      } else {
        throw new Error(`Unsupported language for local execution: ${language}`);
      }

      // Run all test cases in parallel (sandboxed)
      const results = await Promise.all(
        testCases.map(async (tc) => {
          return await runInSandbox({
            cmd: runCommand,
            args: runArgs,
            cwd: tempDir,
            cpuTimeLimit: this.cpuTimeLimit,
            memoryLimitKB: this.memoryLimitKB,
            wallTimeLimit: this.wallTimeLimit,
            outputLimitKB: this.outputLimitKB,
            stdin: tc.stdin || '',
          });
        })
      );

      // Transform sandbox result to the expected format
      return results.map((res) => ({
        stdout: res.stdout,
        stderr: this._formatStderr(res),
        exitCode: res.exitCode,
      }));
    } finally {
      await cleanup(tempDir);
    }
  }

  /**
   * Compile C++ code inside the sandbox (or directly with resource limits).
   * Returns { stdout, stderr, exitCode }.
   */
  async _compileCpp(sourcePath, outputPath, workDir) {
    // Compile using the compiler with standard flags
    // We'll run the compiler without sandbox for speed, but it will be inside the temp dir.
    // For safety, we can also run compiler with limited resources.
    const compileCmd = this.cxxCompiler;
    const compileArgs = [
      '-std=c++17',
      '-O2',
      '-Wall',
      '-o', outputPath,
      sourcePath,
    ];
    // Use runInSandbox with relaxed limits (compiler can use more resources)
    const result = await runInSandbox({
      cmd: compileCmd,
      args: compileArgs,
      cwd: workDir,
      cpuTimeLimit: 10,        // compilation may take a few seconds
      memoryLimitKB: 512000,   // 512 MB
      wallTimeLimit: 15,
      outputLimitKB: 1024,
      stdin: '',
    });
    return result;
  }

  /**
   * Format stderr for consistency with online compiler.
   * Add labels for TLE/MLE/Output limit.
   */
  _formatStderr(sandboxResult) {
    let stderr = sandboxResult.stderr || '';
    if (sandboxResult.timedOut) {
      stderr = (stderr ? stderr + '\n' : '') + 'Time Limit Exceeded';
    }
    if (sandboxResult.memExceeded) {
      stderr = (stderr ? stderr + '\n' : '') + 'Memory Limit Exceeded';
    }
    if (sandboxResult.outputExceeded) {
      stderr = (stderr ? stderr + '\n' : '') + 'Output Limit Exceeded';
    }
    return stderr;
  }
}

module.exports = LocalProvider;