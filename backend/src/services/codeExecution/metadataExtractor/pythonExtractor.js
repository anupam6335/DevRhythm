const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * PythonMetadataExtractor – Extracts execution metadata from Python starter code.
 * Uses Python's ast module (via a temporary script) for accuracy, with a regex fallback.
 */
class PythonMetadataExtractor {
  extract(starterCode) {
    if (!starterCode || typeof starterCode !== 'string' || starterCode.trim() === '') {
      throw new Error('Invalid starter code: empty or not a string');
    }

    try {
      return this._extractWithAST(starterCode);
    } catch (astError) {
      console.warn(`AST parsing failed, falling back to regex: ${astError.message}`);
      return this._extractWithRegex(starterCode);
    }
  }

  /**
   * Use Python's ast module to analyse the starter code.
   */
  _extractWithAST(starterCode) {
    const tempScriptPath = path.join(__dirname, '_temp_ast_parser.py');
    const analysisScript = `
import ast
import json
import sys

def analyze(code):
    tree = ast.parse(code)
    class_name = None
    method_name = None
    return_type = "Any"
    parameters = []
    data_structures = set()
    interactive = False
    methods = []
    constructor_params = []

    # Helper to extract type hints from annotation nodes
    def get_type_from_annotation(annotation):
        if annotation is None:
            return "Any"
        if isinstance(annotation, ast.Name):
            return annotation.id
        if isinstance(annotation, ast.Subscript):
            base = get_type_from_annotation(annotation.value)
            # Handle Optional, List, Dict, Set, Tuple
            if base in ("List", "Dict", "Set", "Tuple", "Optional"):
                return base
            # For nested generics we keep the base name
            return base
        if isinstance(annotation, ast.Attribute):
            return annotation.attr
        return "Any"

    # First, find a class named Solution or any class with methods
    classes = [node for node in tree.body if isinstance(node, ast.ClassDef)]
    target_class = None
    for cls in classes:
        if cls.name == "Solution":
            target_class = cls
            break
    if not target_class and len(classes) == 1:
        target_class = classes[0]   # single class, assume it's the solution class
        interactive = True          # single class with multiple methods -> likely interactive
    if target_class:
        class_name = target_class.name
        methods_in_class = [node for node in target_class.body if isinstance(node, ast.FunctionDef)]
        if len(methods_in_class) > 1:
            interactive = True

        # Look for __init__ to capture constructor parameters
        for func in methods_in_class:
            if func.name == "__init__":
                # parameters: first is self, skip it
                for arg in func.args.args[1:]:
                    arg_name = arg.arg
                    arg_type = get_type_from_annotation(arg.annotation) if arg.annotation else "Any"
                    constructor_params.append(arg_type)
                break

        # Find the first non-__init__ method as the main method
        main_method = None
        for func in methods_in_class:
            if func.name != "__init__":
                main_method = func
                break
        if not main_method and methods_in_class:
            main_method = methods_in_class[0]   # fallback

        if main_method:
            method_name = main_method.name
            if main_method.returns:
                return_type = get_type_from_annotation(main_method.returns)

            # Parse parameters (skip self)
            for arg in main_method.args.args[1:]:
                arg_name = arg.arg
                arg_type = get_type_from_annotation(arg.annotation) if arg.annotation else "Any"
                parameters.append({"name": arg_name, "type": arg_type})
                # Detect known data structures
                if any(ds in arg_type for ds in ("ListNode", "TreeNode", "Node", "NestedInteger")):
                    data_structures.add(arg_type)

            if any(ds in return_type for ds in ("ListNode", "TreeNode", "Node", "NestedInteger")):
                data_structures.add(return_type)

        # Collect all methods for interactive problems
        for func in methods_in_class:
            if func.name == "__init__":
                continue
            ret_type = get_type_from_annotation(func.returns) if func.returns else "Any"
            param_types = []
            for arg in func.args.args[1:]:
                ptype = get_type_from_annotation(arg.annotation) if arg.annotation else "Any"
                param_types.append(ptype)
            methods.append({
                "name": func.name,
                "returnType": ret_type,
                "parameters": param_types
            })
    else:
        # No class: look for top-level function
        top_functions = [node for node in tree.body if isinstance(node, ast.FunctionDef)]
        if top_functions:
            func = top_functions[0]
            method_name = func.name
            return_type = get_type_from_annotation(func.returns) if func.returns else "Any"
            parameters = []
            for arg in func.args.args:
                arg_name = arg.arg
                arg_type = get_type_from_annotation(arg.annotation) if arg.annotation else "Any"
                parameters.append({"name": arg_name, "type": arg_type})
                if any(ds in arg_type for ds in ("ListNode", "TreeNode", "Node", "NestedInteger")):
                    data_structures.add(arg_type)
            if any(ds in return_type for ds in ("ListNode", "TreeNode", "Node", "NestedInteger")):
                data_structures.add(return_type)
        else:
            raise ValueError("No class or function found in starter code")

    # If interactive but no methods were captured, use the main method
    if interactive and len(methods) == 0 and method_name:
        methods.append({
            "name": method_name,
            "returnType": return_type,
            "parameters": [p["type"] for p in parameters]
        })

    result = {
        "className": class_name,
        "methodName": method_name,
        "returnType": return_type,
        "parameters": parameters,
        "dataStructures": list(data_structures),
        "interactive": interactive,
        "methods": methods,
        "constructorParams": constructor_params
    }
    print(json.dumps(result))

if __name__ == "__main__":
    code = sys.stdin.read()
    try:
        analyze(code)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
`;

    fs.writeFileSync(tempScriptPath, analysisScript);
    try {
      const output = execSync(`python ${tempScriptPath}`, {
        input: starterCode,
        encoding: 'utf-8',
        timeout: 5000,
      });
      const result = JSON.parse(output);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    } finally {
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
    }
  }

  /**
   * Fallback regex‑based extraction when AST is unavailable or fails.
   * Handles common LeetCode Python patterns.
   */
  _extractWithRegex(starterCode) {
    let className = null;
    let methodName = null;
    let returnType = 'Any';
    const parameters = [];
    const dataStructuresSet = new Set();
    let interactive = false;
    const methods = [];
    const constructorParams = [];

    // Match class definition
    const classMatch = starterCode.match(/class\s+(\w+)\s*:/);
    if (classMatch) {
      className = classMatch[1];
      // Extract class body (simplistic but works for well‑formed code)
      const classStart = classMatch.index;
      let braceCount = 0;
      let classBody = '';
      for (let i = classStart; i < starterCode.length; i++) {
        const ch = starterCode[i];
        classBody += ch;
        if (ch === ':') braceCount++;
        // crude detection of end of class: next line with no indent or EOF
        if (i > classStart && /^\S/.test(starterCode[i]) && braceCount === 1) {
          break;
        }
      }
      // Find all methods in class body
      const methodRegex = /def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?\s*:/g;
      let match;
      const methodsList = [];
      while ((match = methodRegex.exec(classBody)) !== null) {
        const name = match[1];
        const paramStr = match[2];
        const retType = (match[3] || 'Any').trim();
        methodsList.push({ name, paramStr, retType });
      }
      if (methodsList.length === 0) {
        throw new Error('No method found in class');
      }
      // Separate __init__ from others
      const initMethod = methodsList.find(m => m.name === '__init__');
      if (initMethod) {
        const params = initMethod.paramStr.split(',').map(p => p.trim()).filter(p => p && p !== 'self');
        for (const param of params) {
          const typeMatch = param.match(/:?\s*(\w+)$/);
          const paramType = typeMatch ? typeMatch[1] : 'Any';
          constructorParams.push(paramType);
        }
      }
      const otherMethods = methodsList.filter(m => m.name !== '__init__');
      if (otherMethods.length > 1) {
        interactive = true;
      }
      const mainMethod = otherMethods[0];
      if (!mainMethod) {
        throw new Error('No public method found');
      }
      methodName = mainMethod.name;
      returnType = mainMethod.retType;
      // Parse parameters
      let paramParts = mainMethod.paramStr.split(',').map(p => p.trim()).filter(p => p);
      if (paramParts.length && paramParts[0] === 'self') {
        paramParts = paramParts.slice(1);
      }
      for (const part of paramParts) {
        let [namePart, typePart] = part.split(':');
        namePart = namePart.trim();
        let paramType = typePart ? typePart.trim() : 'Any';
        parameters.push({ name: namePart, type: paramType });
        if (/ListNode|TreeNode|Node|NestedInteger/.test(paramType)) {
          dataStructuresSet.add(paramType);
        }
      }
      if (/ListNode|TreeNode|Node|NestedInteger/.test(returnType)) {
        dataStructuresSet.add(returnType);
      }
      // Build methods list for interactive
      for (const m of otherMethods) {
        const paramTypes = [];
        let paramParts2 = m.paramStr.split(',').map(p => p.trim()).filter(p => p);
        if (paramParts2.length && paramParts2[0] === 'self') {
          paramParts2 = paramParts2.slice(1);
        }
        for (const part of paramParts2) {
          const typeMatch = part.match(/:?\s*(\w+)$/);
          paramTypes.push(typeMatch ? typeMatch[1] : 'Any');
        }
        methods.push({
          name: m.name,
          returnType: m.retType,
          parameters: paramTypes,
        });
      }
    } else {
      // No class: look for top‑level function
      const funcMatch = starterCode.match(/def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?\s*:/);
      if (!funcMatch) {
        throw new Error('No function or class found in starter code');
      }
      methodName = funcMatch[1];
      returnType = (funcMatch[3] || 'Any').trim();
      const paramStr = funcMatch[2];
      const paramParts = paramStr.split(',').map(p => p.trim()).filter(p => p);
      for (const part of paramParts) {
        let [namePart, typePart] = part.split(':');
        namePart = namePart.trim();
        let paramType = typePart ? typePart.trim() : 'Any';
        parameters.push({ name: namePart, type: paramType });
        if (/ListNode|TreeNode|Node|NestedInteger/.test(paramType)) {
          dataStructuresSet.add(paramType);
        }
      }
      if (/ListNode|TreeNode|Node|NestedInteger/.test(returnType)) {
        dataStructuresSet.add(returnType);
      }
      interactive = false;
    }

    return {
      className,
      methodName,
      returnType,
      parameters,
      dataStructures: Array.from(dataStructuresSet),
      interactive,
      methods,
      constructorParams,
    };
  }
}

module.exports = PythonMetadataExtractor;