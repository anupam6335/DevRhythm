/**
 * CppExtractor - Extracts execution metadata from C++ starter code.
 * Uses regex parsing (sufficient for LeetCode‑style code).
 */
class CppExtractor {
  /**
   * Extract metadata from C++ starter code.
   * @param {string} starterCode - The C++ starter code provided by the platform.
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

    // Find the main class (usually `class Solution` or any class with methods)
    const classRegex = /class\s+(\w+)\s*(?::\s*public\s+\w+)?\s*\{/;
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
      // No class found – maybe standalone functions (rare in LeetCode but possible)
      // We'll treat the whole code as a single "class" with no name.
      className = null;
      classBody = codeWithoutComments;
    }

    // Find all public methods inside the class (or top‑level functions)
    // Method signature regex: returnType methodName(parameters)
    const methodRegex = /(?:public:\s*)?\s*(\w+(?:\s*<[^>]+>)?(?:\s*\*)?(?:\s*&)?(?:\s*const)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*(?:override)?\s*\{/g;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      let returnType = match[1].trim();
      const methodName = match[2];
      let paramStr = match[3];
      // Clean up returnType (remove trailing '*', '&', 'const')
      returnType = returnType.replace(/\*$/, '').replace(/&$/, '').replace(/const$/, '').trim();
      methods.push({ name: methodName, returnType, paramStr });
    }

    if (methods.length === 0) {
      throw new Error('No public method found in C++ code');
    }

    // For C++, constructors are methods with the same name as the class
    const constructorMethod = className ? methods.find(m => m.name === className) : null;
    const otherMethods = className ? methods.filter(m => m.name !== className) : methods;

    // Determine interactivity: more than one public method (excluding constructor) or if class name is not `Solution`
    const interactive = otherMethods.length > 1 || (className !== 'Solution' && otherMethods.length >= 1);

    // The main method is the first non‑constructor method (or the first method if no class)
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
   * Remove C++ comments (both // and /* * /).
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
   * Parse a parameter string (e.g., "int* nums, int target, ListNode* head").
   * Returns an array of objects: [{ name: "nums", type: "int*" }, ...]
   */
  _parseParameters(paramStr) {
    if (!paramStr.trim()) return [];
    // Split by commas, but respect angle brackets (generics/templates)
    const parts = this._splitRespectingAngleBrackets(paramStr);
    const params = [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === '') continue;
      // The last token is the parameter name; everything before is the type.
      // Type may contain spaces (e.g., "vector<int>")
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 2) {
        // No space? Then the whole thing is the type and the name is implied? (unlikely)
        // Fallback: treat as type only, name = "param"
        params.push({ name: "param" + params.length, type: trimmed });
        continue;
      }
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
    const parts = this._splitRespectingAngleBrackets(paramStr);
    const types = [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === '') continue;
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 2) {
        types.push(trimmed);
        continue;
      }
      const paramType = tokens.slice(0, -1).join(' ');
      types.push(paramType);
    }
    return types;
  }

  /**
   * Split a parameter list by commas, but ignore commas inside angle brackets (templates).
   */
  _splitRespectingAngleBrackets(str) {
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

module.exports = CppExtractor;