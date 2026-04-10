/**
 * Parse a LeetCode example input string into an array of arguments.
 * Supports: numbers, strings, arrays, nested arrays, booleans, null.
 * Input format: "nums = [2,7,11,15], target = 9"
 * Output: [[2,7,11,15], 9]
 */
function parseInputString(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return [];
  
  // Remove any outer quotes if present
  let trimmed = inputStr.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1);
  }
  
  // Split by top-level commas (not inside brackets)
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '[' || ch === '{' || ch === '(') depth++;
    else if (ch === ']' || ch === '}' || ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  
  // Each part is like "nums = [2,7,11,15]" or "target = 9"
  const args = [];
  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) {
      // No '=', treat as raw value
      args.push(parseValue(part));
    } else {
      const valueStr = part.substring(eqIndex + 1).trim();
      args.push(parseValue(valueStr));
    }
  }
  return args;
}

/**
 * Parse a value string into a JSON-compatible type.
 */
function parseValue(valueStr) {
  valueStr = valueStr.trim();
  if (valueStr === 'null') return null;
  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;
  if (valueStr === 'undefined') return null;
  
  // Try to parse as number
  const num = Number(valueStr);
  if (!isNaN(num) && valueStr !== '') return num;
  
  // Try to parse as array
  if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
    const inner = valueStr.slice(1, -1).trim();
    if (inner === '') return [];
    const items = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '[' || ch === '{' || ch === '(') depth++;
      else if (ch === ']' || ch === '}' || ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        items.push(parseValue(current.trim()));
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) items.push(parseValue(current.trim()));
    return items;
  }
  
  // String (remove surrounding quotes)
  if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
    return valueStr.slice(1, -1);
  }
  
  // Fallback: return as string
  return valueStr;
}

/**
 * Parse expected output string into a JSON value.
 */
function parseExpectedString(expectedStr) {
  if (!expectedStr) return null;
  // Try to parse as JSON directly
  try {
    return JSON.parse(expectedStr);
  } catch (e) {
    // Fallback to parseValue
    return parseValue(expectedStr);
  }
}

/**
 * Convert an array of raw test cases (from LeetCode examples or user input)
 * into structured format using the extracted method metadata.
 * @param {Array} rawTestCases - Array of objects with stdin and expected strings
 * @param {Object} metadata - { paramTypes, returnType }
 * @returns {Array} structured test cases { args, expected }
 */
function convertToStructuredTestCases(rawTestCases, metadata) {
  if (!rawTestCases || !Array.isArray(rawTestCases)) return [];
  
  return rawTestCases.map(tc => {
    const args = parseInputString(tc.stdin || '');
    const expected = parseExpectedString(tc.expected || '');
    return { args, expected };
  });
}

module.exports = {
  parseInputString,
  parseExpectedString,
  convertToStructuredTestCases
};