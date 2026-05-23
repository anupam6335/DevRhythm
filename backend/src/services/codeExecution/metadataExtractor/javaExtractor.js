/**
 * JavaMetadataExtractor - Extracts execution metadata from Java starter code.
 * Uses regex parsing (robust enough for LeetCode‑style code) because running a full Java AST parser would be too heavy.
 */
class JavaMetadataExtractor {
  /**
   * Extract metadata from Java starter code.
   * @param {string} starterCode - The Java starter code provided by the platform.
   * @returns {Object} Metadata object with the following shape:
   * {
   *   className: string|null,
   *   methodName: string,
   *   returnType: string,
   *   parameters: [{ name: string, type: string }],
   *   dataStructures: string[],
   *   interactive: boolean,
   *   methods: [{ name: string, returnType: string, parameters: string[] }],
   *   constructorParams: string[]
   * }
   */
  extract(starterCode) {
    if (!starterCode || typeof starterCode !== 'string' || starterCode.trim() === '') {
      throw new Error('Invalid starter code: empty or not a string');
    }

    // Remove all comments to simplify parsing
    const codeWithoutComments = this._removeComments(starterCode);

    // Find the main class (usually public class Solution, but could be any class)
    const classMatch = codeWithoutComments.match(/public\s+class\s+(\w+)\s*\{/);
    if (!classMatch) {
      throw new Error('No public class found in starter code');
    }
    const className = classMatch[1];

    // Extract the entire class body (between { and matching })
    const classOpenPos = classMatch.index + classMatch[0].length - 1; // position of '{'
    const classBody = this._extractBracedBlock(codeWithoutComments, classOpenPos);
    if (!classBody) {
      throw new Error('Could not extract class body');
    }

    // Find all methods inside the class (skip constructors and static blocks)
    const methodRegex = /public\s+(?:static\s+)?(\w+(?:<[^>]+>)?(?:\s*\[\])?)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      const returnType = match[1].trim();
      const methodName = match[2];
      const paramStr = match[3];
      methods.push({ name: methodName, returnType, paramStr });
    }

    if (methods.length === 0) {
      throw new Error('No public method found in class');
    }

    // Separate constructor (method with same name as class) from others
    const constructorMethod = methods.find(m => m.name === className);
    const otherMethods = methods.filter(m => m.name !== className);

    // Determine interactivity: if there is more than one public method (excluding constructor), or if class name is not Solution
    const interactive = otherMethods.length > 1 || (className !== 'Solution' && otherMethods.length >= 1);

    // The main method is the first non‑constructor method (or the only method if no constructor)
    const mainMethod = otherMethods[0] || methods[0];
    if (!mainMethod) {
      throw new Error('No suitable main method found');
    }

    const methodName = mainMethod.name;
    let returnType = mainMethod.returnType;

    // Parse parameters of the main method
    const parameters = this._parseParameters(mainMethod.paramStr);
    // Collect required data structures from parameter types and return type
    const dataStructuresSet = new Set();
    for (const param of parameters) {
      this._addDataStructuresFromType(param.type, dataStructuresSet);
    }
    this._addDataStructuresFromType(returnType, dataStructuresSet);

    // Parse constructor parameters (if constructor exists)
    let constructorParams = [];
    if (constructorMethod) {
      constructorParams = this._parseParameterTypes(constructorMethod.paramStr);
    }

    // Build methods list for interactive problems
    const methodsList = [];
    for (const m of otherMethods) {
      const paramTypes = this._parseParameterTypes(m.paramStr);
      methodsList.push({
        name: m.name,
        returnType: m.returnType,
        parameters: paramTypes,
      });
    }

    return {
      className,
      methodName,
      returnType,
      parameters,
      dataStructures: Array.from(dataStructuresSet),
      interactive,
      methods: methodsList,
      constructorParams,
    };
  }

  /**
   * Remove Java comments (both // and /* * /) to simplify parsing.
   */
  _removeComments(code) {
    // Remove block comments /* ... */
    let noBlockComments = code.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove line comments // ...
    let noLineComments = noBlockComments.replace(/\/\/.*$/gm, '');
    return noLineComments;
  }

  /**
   * Extract the content inside braces starting at a given position.
   * Returns the substring from the opening brace to the matching closing brace.
   */
  _extractBracedBlock(str, openPos) {
    let balance = 1;
    let i = openPos + 1;
    while (i < str.length && balance > 0) {
      if (str[i] === '{') balance++;
      else if (str[i] === '}') balance--;
      i++;
    }
    if (balance !== 0) return null;
    return str.substring(openPos + 1, i - 1);
  }

  /**
   * Parse a parameter string (e.g., "int[] nums, ListNode head, String s").
   * Returns an array of objects: [{ name: "nums", type: "int[]" }, ...]
   */
  _parseParameters(paramStr) {
    if (!paramStr.trim()) return [];
    // Split by commas, but respect generics (e.g., List<String>)
    const parts = this._splitRespectingGenerics(paramStr);
    const params = [];
    for (const part of parts) {
      const trimmed = part.trim();
      // Last word is the parameter name; everything before is the type
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 2) continue; // malformed
      const paramName = tokens[tokens.length - 1];
      const paramType = tokens.slice(0, -1).join(' ');
      params.push({ name: paramName, type: paramType });
    }
    return params;
  }

  /**
   * Parse a parameter string into an array of types only (for methods list).
   */
  _parseParameterTypes(paramStr) {
    if (!paramStr.trim()) return [];
    const parts = this._splitRespectingGenerics(paramStr);
    const types = [];
    for (const part of parts) {
      const trimmed = part.trim();
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 2) continue;
      const paramType = tokens.slice(0, -1).join(' ');
      types.push(paramType);
    }
    return types;
  }

  /**
   * Split a parameter list by commas, but ignore commas inside angle brackets (generics).
   */
  _splitRespectingGenerics(str) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '<') depth++;
      else if (ch === '>') depth--;
      else if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) parts.push(current);
    return parts;
  }

  /**
   * Check a type string for known data structures (ListNode, TreeNode, Node, NestedInteger)
   * and add them to the set.
   */
  _addDataStructuresFromType(type, set) {
    if (type.includes('ListNode')) set.add('ListNode');
    if (type.includes('TreeNode')) set.add('TreeNode');
    if (type.includes('Node')) set.add('Node');
    if (type.includes('NestedInteger')) set.add('NestedInteger');
    // Add more if needed (e.g., 'DoublyListNode')
  }
}

module.exports = JavaMetadataExtractor;