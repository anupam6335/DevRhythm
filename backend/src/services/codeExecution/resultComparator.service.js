/**
 * Compare actual output with expected output using deep equality.
 * @param {any} actual - parsed actual output
 * @param {any} expected - parsed expected output
 * @param {Object} options - { orderInsensitive: boolean, epsilon: number }
 * @returns {boolean}
 */

function deepEqual(actual, expected, options = {}) {
  const { orderInsensitive = false, epsilon = 1e-9 } = options;
  const stack = [{ actual, expected }];
  const visited = new WeakSet(); // track object/array pairs to detect cycles

  while (stack.length) {
    const { actual, expected } = stack.pop();

    // Handle primitive and null/undefined cases (same as before)
    if (actual === expected) continue;
    if (actual == null || expected == null) return false;
    if (typeof actual !== typeof expected) return false;

    // Number with epsilon
    if (typeof actual === 'number' && typeof expected === 'number') {
      if (Math.abs(actual - expected) >= epsilon) return false;
      continue;
    }

    // String, boolean, etc.
    if (typeof actual !== 'object') {
      if (actual !== expected) return false;
      continue;
    }

    // Detect cycles
    if (visited.has(actual) || visited.has(expected)) return false;
    visited.add(actual);
    visited.add(expected);

    // Arrays
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      if (orderInsensitive) {
        const sortedActual = [...actual].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        const sortedExpected = [...expected].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        // Push in reverse order to process correctly (stack LIFO)
        for (let i = sortedActual.length - 1; i >= 0; i--) {
          stack.push({ actual: sortedActual[i], expected: sortedExpected[i] });
        }
      } else {
        for (let i = actual.length - 1; i >= 0; i--) {
          stack.push({ actual: actual[i], expected: expected[i] });
        }
      }
      continue;
    }

    // Plain objects
    const keysActual = Object.keys(actual);
    const keysExpected = Object.keys(expected);
    if (keysActual.length !== keysExpected.length) return false;
    for (let i = keysActual.length - 1; i >= 0; i--) {
      const key = keysActual[i];
      if (!keysExpected.includes(key)) return false;
      stack.push({ actual: actual[key], expected: expected[key] });
    }
  }
  return true;
}
/**
 * Compare a test case result.
 * @param {string|object} actualOutput - stdout from execution (may be JSON string)
 * @param {string|object} expectedOutput - expected output (may be JSON string)
 * @param {Object} options - comparison options
 * @returns {boolean}
 */
function compareResult(actualOutput, expectedOutput, options = {}) {
    let actualParsed, expectedParsed;
    try {
        actualParsed = typeof actualOutput === 'string' ? JSON.parse(actualOutput) : actualOutput;
    } catch {
        actualParsed = actualOutput;
    }
    try {
        expectedParsed = typeof expectedOutput === 'string' ? JSON.parse(expectedOutput) : expectedOutput;
    } catch {
        expectedParsed = expectedOutput;
    }
    return deepEqual(actualParsed, expectedParsed, options);
}

module.exports = { compareResult };