const fs = require('fs');
const path = require('path');

class PythonGenerator {
  generateWrapper(userCode, metadata, testCases) {
    if (!userCode || typeof userCode !== 'string') {
      throw new Error('Invalid user code');
    }
    if (!metadata || !metadata.methodName) {
      throw new Error('Invalid metadata: missing methodName');
    }

    const helperCode = this._getRequiredHelpers(metadata.dataStructures || []);
    const deserCode = this._generateDeserialization(metadata.parameters);
    const callCode = this._generateMethodCall(metadata);
    const serCode = this._generateSerialization(metadata.returnType);
    const solveFunction = this._buildSolveFunction(deserCode, callCode, serCode);
    const imports = this._generateImports(metadata);
    const mainBlock = this._generateMainBlock();

    return `${imports}\n\n${helperCode}\n\n${userCode}\n\n${solveFunction}\n\n${mainBlock}`;
  }

  _getRequiredHelpers(dataStructures) {
    if (!dataStructures.length) return '';
    const structuresPath = path.join(__dirname, '../helpers/python/structures.py');
    try {
      return fs.readFileSync(structuresPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not read structures.py: ${err.message}`);
      return '';
    }
  }

  _generateDeserialization(parameters) {
    if (!parameters.length) return '';
    const lines = [];
    lines.push(`        if len(args) < ${parameters.length}:`);
    lines.push(`            args += [None] * (${parameters.length} - len(args))`);
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      const paramType = param.type;
      let expr = `args[${i}]`;
      if (paramType.includes('ListNode')) expr = `deserialize_linked_list(args[${i}])`;
      else if (paramType.includes('TreeNode')) expr = `deserialize_tree(args[${i}])`;
      else if (paramType.includes('Node')) expr = `deserialize_node(args[${i}])`;
      else if (paramType.includes('NestedInteger')) expr = `deserialize_nested_integer(args[${i}])`;
      lines.push(`        arg_${i} = ${expr}`);
    }
    return lines.join('\n');
  }

  _generateMethodCall(metadata) {
    if (metadata.interactive) {
      return this._generateInteractiveCall(metadata);
    } else {
      return this._generateStandardCall(metadata);
    }
  }

  _generateStandardCall(metadata) {
    const { className, methodName, parameters } = metadata;
    const argNames = parameters.map((_, i) => `arg_${i}`).join(', ');
    if (className) {
      return `        obj = ${className}()\n        result = obj.${methodName}(${argNames})`;
    } else {
      return `        result = ${methodName}(${argNames})`;
    }
  }

  _generateInteractiveCall(metadata) {
    const { className, constructorParams, methods } = metadata;
    const constrArgs = constructorParams.map((_, i) => `constr_args[${i}]`).join(', ');
    const lines = [
      '        obj = None',
      '        results = []',
      '        if "class" in data:',
      `            class_name = data["class"]`,
      '        else:',
      `            class_name = "${className}"`,
      '        constr_args = data.get("constructor", [])',
      `        obj = globals()[class_name](${constrArgs})`,
      '        results.append(None)',
      '        for call in data.get("methods", []):',
      '            if not isinstance(call, list) or len(call) == 0:',
      '                results.append(None)',
      '                continue',
      '            method_name = call[0]',
      '            method_args = call[1:]',
      '            method = getattr(obj, method_name, None)',
      '            if method is None:',
      '                results.append(None)',
      '                continue',
      '            res = method(*method_args)',
      '            results.append(res)',
      '        result = results'
    ];
    return lines.join('\n');
  }

  _generateSerialization(returnType) {
    if (returnType === 'void' || returnType === 'None') {
      return '        return "null"';
    }
    if (returnType.includes('ListNode')) {
      return '        return json.dumps(serialize_linked_list(result))';
    }
    if (returnType.includes('TreeNode')) {
      return '        return json.dumps(serialize_tree(result))';
    }
    if (returnType.includes('Node')) {
      return '        return json.dumps(serialize_node(result))';
    }
    if (returnType.includes('NestedInteger')) {
      return '        return json.dumps(serialize_nested_integer(result))';
    }
    return '        return json.dumps(result, default=str)';
  }

  _buildSolveFunction(deserCode, callCode, serCode) {
    return `def solve(input_str):
    import json
    try:
        data = json.loads(input_str)
        args = data.get("args", [])
${deserCode}
${callCode}
${serCode}
    except Exception as e:
        import sys
        sys.stderr.write(str(e))
        return "null"`;
  }

  _generateImports(metadata) {
    const imports = new Set(['import json', 'import sys']);
    if ((metadata.dataStructures || []).includes('TreeNode')) {
      imports.add('from collections import deque');
    }
    imports.add('from typing import List, Optional, Dict, Any, Set, Tuple');
    return Array.from(imports).join('\n');
  }

  _generateMainBlock() {
    return `
if __name__ == "__main__":
    import sys
    input_str = sys.stdin.read().strip()
    if not input_str:
        sys.stderr.write("Empty input")
        sys.stdout.write("null")
    else:
        out = solve(input_str)
        sys.stdout.write(out)
    sys.stdout.flush()
    sys.exit(0)`;
  }
}

module.exports = PythonGenerator;