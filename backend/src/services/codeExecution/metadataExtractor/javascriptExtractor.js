/**
 * JsExtractor - Extracts execution metadata from JavaScript starter code.
 * Uses regex parsing (sufficient for LeetCode‑style code).
 */
class JsExtractor {
  /**
   * Extract metadata from JavaScript starter code.
   * @param {string} starterCode - The JavaScript starter code provided by the platform.
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

    // Remove comments to simplify parsing
    const codeWithoutComments = this._removeComments(starterCode);

    // Find class definition (class Solution { ... })
    const classRegex = /class\s+(\w+)\s*\{/;
    let classMatch = codeWithoutComments.match(classRegex);
    let className = null;
    let classBody = '';

    if (classMatch) {
      className = classMatch[1];
      const classStart = classMatch.index + classMatch[0].length - 1; // position of '{'
      classBody = this._extractBracedBlock(codeWithoutComments, classStart);
      if (!classBody) {
        throw new Error('Could not extract class body');
      }
    } else {
      // No class found – maybe a standalone function
      className = null;
      classBody = codeWithoutComments;
    }

    // Find all methods inside the class body (or top‑level functions)
    // Method signature regex: methodName(params) { ... }   (also handles async, generator)
    const methodRegex = /(?:async\s+)?(?:function\s+)?(\w+)\s*\(([^)]*)\)\s*\{/g;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      const methodName = match[1];
      const paramStr = match[2];
      // Skip constructor if it's a class and methodName === className
      if (className && methodName === className) {
        // This is a constructor – we'll handle separately
        continue;
      }
      // Determine return type (inferred from usage, but we default to "any" for JS)
      const returnType = 'any';
      methods.push({ name: methodName, returnType, paramStr });
    }

    if (methods.length === 0) {
      throw new Error('No method found in JavaScript code');
    }

    // For JS, constructors are not explicitly marked; we detect by name === className
    const constructorMethod = className ? this._findConstructor(classBody, className) : null;
    const otherMethods = methods;

    // Determine interactivity: more than one public method, or class name is not 'Solution' and has at least one method
    const interactive = otherMethods.length > 1 || (className !== 'Solution' && otherMethods.length >= 1);

    // The main method is the first method (or the one named something like "solution" or "myFunction"?)
    // LeetCode usually has only one method in starter code; we'll take the first.
    const mainMethod = otherMethods[0];
    if (!mainMethod) {
      throw new Error('No suitable main method found');
    }

    const methodName = mainMethod.name;
    const returnType = 'any'; // JavaScript is dynamically typed

    // Parse parameters of the main method
    const parameters = this._parseParameters(mainMethod.paramStr);
    // Collect required data structures from parameter names (heuristic) – in JS, types are not explicit,
    // but we can detect from common naming or from code usage. For simplicity, we check if the parameter name
    // suggests a data structure (e.g., "head" might be ListNode, "root" might be TreeNode).
    const dataStructuresSet = new Set();
    for (const param of parameters) {
      this._addDataStructuresFromName(param.name, dataStructuresSet);
    }

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
   * Remove JavaScript comments (both // and /* * /).
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
   * Parse a parameter string (e.g., "nums, target, head").
   * Returns an array of objects: [{ name: "nums", type: "any" }, ...]
   */
  _parseParameters(paramStr) {
    if (!paramStr.trim()) return [];
    // Split by commas, but respect nested structures (unlikely in param list)
    const parts = paramStr.split(',').map(p => p.trim()).filter(p => p);
    const params = [];
    for (const part of parts) {
      // In JS, parameters may have default values, but we ignore them.
      let name = part.split('=')[0].trim();
      // Also remove destructuring patterns? Not needed for LeetCode basic types.
      params.push({ name, type: 'any' });
    }
    return params;
  }

  /**
   * Parse a parameter string into an array of types only (for methods list).
   * Since JS has no type annotations, we return an array of "any" strings.
   */
  _parseParameterTypes(paramStr) {
    if (!paramStr.trim()) return [];
    const parts = paramStr.split(',').map(p => p.trim()).filter(p => p);
    return parts.map(() => 'any');
  }

  /**
   * Find constructor method inside a class body.
   * In JS, constructor is a method named "constructor".
   */
  _findConstructor(classBody, className) {
    const constructorRegex = /constructor\s*\(([^)]*)\)\s*\{/;
    const match = constructorRegex.exec(classBody);
    if (!match) return null;
    return { name: 'constructor', paramStr: match[1], returnType: 'void' };
  }

  /**
   * Heuristically detect required data structures based on parameter names.
   * For JavaScript, we rely on common naming conventions.
   */
  _addDataStructuresFromName(paramName, set) {
    const lowerName = paramName.toLowerCase();
    if (lowerName.includes('head') || lowerName.includes('node') || lowerName === 'list') {
      set.add('ListNode');
    }
    if (lowerName.includes('root') || lowerName.includes('tree') || lowerName === 'node') {
      set.add('TreeNode');
    }
    if (lowerName === 'graph' || lowerName.includes('adj')) {
      set.add('Node');
    }
    if (lowerName === 'nested' || lowerName === 'nestedinteger') {
      set.add('NestedInteger');
    }
    // Also check if the code contains new ListNode(...) or other structure instantiations
    // Not implemented here because extractor only sees starter code, not user code.
  }
}

module.exports = JsExtractor;