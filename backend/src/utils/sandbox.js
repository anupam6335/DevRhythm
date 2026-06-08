/**
 * src/utils/sandbox.js
 *
 * Sandbox execution wrapper for isolate/nsjail.
 * Runs commands with strict resource limits.
 */

const { execFile, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Default limits (overridden by config)
const DEFAULT_CPU_LIMIT = 2;        // seconds
const DEFAULT_MEMORY_LIMIT_KB = 256000; // 256 MB
const DEFAULT_WALL_TIME_LIMIT = 5;  // seconds
const DEFAULT_OUTPUT_LIMIT_KB = 1024; // 1 MB

// Sandbox detection cache
let detectedSandbox = null;

/**
 * Detect available sandbox tool.
 * Returns 'isolate', 'nsjail', or 'none'.
 */
async function detectSandbox() {
  if (detectedSandbox !== null) return detectedSandbox;

  // Check for isolate
  try {
    await new Promise((resolve, reject) => {
      execFile('isolate', ['--version'], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    detectedSandbox = 'isolate';
    console.log('[Sandbox] Detected isolate');
    return detectedSandbox;
  } catch (e) {
    // not found
  }

  // Check for nsjail
  try {
    await new Promise((resolve, reject) => {
      execFile('nsjail', ['--version'], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    detectedSandbox = 'nsjail';
    console.log('[Sandbox] Detected nsjail');
    return detectedSandbox;
  } catch (e) {
    // not found
  }

  detectedSandbox = 'none';
  console.warn('[Sandbox] No sandbox tool found. Running without sandbox (unsafe for production).');
  return detectedSandbox;
}

/**
 * Create a temporary sandbox directory for isolate.
 * @param {string} boxId - Unique box identifier
 * @returns {Promise<string>} Path to the sandbox root
 */
async function createIsolateBox(boxId) {
  // Run isolate --init to create box
  const initDir = `/var/local/lib/isolate/${boxId}`;
  try {
    await fs.mkdir(initDir, { recursive: true });
  } catch (err) {
    // ignore if exists
  }
  await new Promise((resolve, reject) => {
    execFile('isolate', ['--init', `--box-id=${boxId}`], (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  return `/var/local/lib/isolate/${boxId}/box`;
}

/**
 * Cleanup isolate box.
 * @param {string} boxId
 */
async function cleanupIsolateBox(boxId) {
  try {
    await new Promise((resolve, reject) => {
      execFile('isolate', ['--cleanup', `--box-id=${boxId}`], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (err) {
    console.warn(`[Sandbox] Failed to cleanup isolate box ${boxId}:`, err.message);
  }
}

/**
 * Run command inside sandbox.
 * @param {Object} options
 * @param {string} options.cmd - Command to run (e.g., 'python3', './a.out')
 * @param {string[]} options.args - Arguments for the command
 * @param {string} options.cwd - Working directory (inside sandbox)
 * @param {number} options.cpuTimeLimit - CPU time limit in seconds
 * @param {number} options.memoryLimitKB - Memory limit in KB
 * @param {number} options.wallTimeLimit - Wall‑clock time limit in seconds
 * @param {number} options.outputLimitKB - Output limit in KB
 * @param {string} options.stdin - Input string (optional)
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, timedOut: boolean, memExceeded: boolean, outputExceeded: boolean}>}
 */
async function runInSandbox(options) {
  const {
    cmd,
    args = [],
    cwd,
    cpuTimeLimit = DEFAULT_CPU_LIMIT,
    memoryLimitKB = DEFAULT_MEMORY_LIMIT_KB,
    wallTimeLimit = DEFAULT_WALL_TIME_LIMIT,
    outputLimitKB = DEFAULT_OUTPUT_LIMIT_KB,
    stdin = '',
  } = options;

  const sandbox = await detectSandbox();

  if (sandbox === 'none') {
    return runWithoutSandbox({ cmd, args, cwd, wallTimeLimit, stdin, outputLimitKB });
  }

  if (sandbox === 'isolate') {
    return runWithIsolate({ cmd, args, cwd, cpuTimeLimit, memoryLimitKB, wallTimeLimit, outputLimitKB, stdin });
  }

  if (sandbox === 'nsjail') {
    return runWithNsjail({ cmd, args, cwd, cpuTimeLimit, memoryLimitKB, wallTimeLimit, outputLimitKB, stdin });
  }

  throw new Error(`Unsupported sandbox: ${sandbox}`);
}

/**
 * Run with isolate.
 */
async function runWithIsolate({ cmd, args, cwd, cpuTimeLimit, memoryLimitKB, wallTimeLimit, outputLimitKB, stdin }) {
  const boxId = generateId();
  let sandboxRoot = null;
  try {
    sandboxRoot = await createIsolateBox(boxId);

    // Create working directory inside the box and copy files
    const innerDir = path.join(sandboxRoot, 'work');
    await fs.mkdir(innerDir, { recursive: true });
    const files = await fs.readdir(cwd);
    for (const file of files) {
      const src = path.join(cwd, file);
      const dest = path.join(innerDir, file);
      await fs.copyFile(src, dest);
    }

    // Build isolate command
    const isolateArgs = [
      `--box-id=${boxId}`,
      '--dir=/box',
      '--processes',
      `--time=${cpuTimeLimit.toFixed(2)}`,
      `--wall-time=${wallTimeLimit}`,
      `--mem=${Math.ceil(memoryLimitKB / 1024)}`, // isolate uses MB
      '--stderr-to-stdout',
      '--run',
      '--', cmd, ...args,
      `--chdir=/box/work`,
    ];

    const result = await new Promise((resolve, reject) => {
      const proc = spawn('isolate', isolateArgs, { cwd: '/', stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let killed = false;

      const timeout = setTimeout(() => {
        proc.kill('SIGKILL');
        killed = true;
      }, wallTimeLimit * 1000 + 2000);

      proc.stdin.end(stdin);
      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        clearTimeout(timeout);
        resolve({ code, stdout, stderr, killed });
      });
      proc.on('error', reject);
    });

    let outputExceeded = false;
    if (result.stdout.length > outputLimitKB * 1024) {
      outputExceeded = true;
      result.stdout = result.stdout.slice(0, outputLimitKB * 1024) + '\n... (output truncated)';
    }
    if (result.stderr.length > outputLimitKB * 1024) {
      outputExceeded = true;
      result.stderr = result.stderr.slice(0, outputLimitKB * 1024) + '\n... (output truncated)';
    }

    const timedOut = result.killed || (result.code === 124);
    const memExceeded = result.code === 9; // SIGKILL often indicates memory limit

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.code,
      timedOut,
      memExceeded,
      outputExceeded,
    };
  } finally {
    if (boxId) await cleanupIsolateBox(boxId);
  }
}

/**
 * Run with nsjail (simplified – not fully implemented; fallback to isolate).
 */
async function runWithNsjail(options) {
  console.warn('[Sandbox] nsjail not fully implemented, falling back to isolate');
  return runWithIsolate(options);
}

/**
 * Run without sandbox (development only). No resource limits except wall‑clock timeout.
 */
async function runWithoutSandbox({ cmd, args, cwd, wallTimeLimit, stdin, outputLimitKB }) {
  const result = await new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let killed = false;

    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      killed = true;
    }, wallTimeLimit * 1000);

    proc.stdin.end(stdin);
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr, killed });
    });
    proc.on('error', reject);
  });

  let outputExceeded = false;
  if (result.stdout.length > outputLimitKB * 1024) {
    outputExceeded = true;
    result.stdout = result.stdout.slice(0, outputLimitKB * 1024) + '\n... (output truncated)';
  }
  if (result.stderr.length > outputLimitKB * 1024) {
    outputExceeded = true;
    result.stderr = result.stderr.slice(0, outputLimitKB * 1024) + '\n... (output truncated)';
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.code,
    timedOut: result.killed,
    memExceeded: false,
    outputExceeded,
  };
}

module.exports = {
  runInSandbox,
  detectSandbox,
};