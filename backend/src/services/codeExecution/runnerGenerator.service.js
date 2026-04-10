const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, 'runnerTemplates');

function loadTemplate(language) {
    const map = {
        python: 'python.template.txt',
        javascript: 'javascript.template.txt',
        cpp: 'cpp.template.txt',
        java: 'java.template.txt'
    };
    const filename = map[language];
    if (!filename) throw new Error(`No template for language: ${language}`);
    return fs.readFileSync(path.join(TEMPLATE_DIR, filename), 'utf8');
}

function transformTypeHint(hint, language) {
    if (!hint) return 'any';
    let inner = hint;
    if (hint.startsWith('Optional[') && hint.endsWith(']')) {
        inner = hint.slice(9, -1);
    }
    if (language === 'javascript') {
        if (inner.startsWith('Optional[')) {
            inner = inner.replace(/Optional\[(.*)\]/, 'Optional<$1>');
        }
        return inner;
    }
    return inner;
}

function stripImports(code) {
    return code.split('\n').filter(line => !line.trim().startsWith('import')).join('\n');
}

function toJavaListInitializer(jsonArray) {
    const arr = JSON.parse(jsonArray);
    if (!Array.isArray(arr)) return 'java.util.Collections.emptyList()';
    const elements = arr.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ');
    return `java.util.Arrays.asList(new String[]{${elements}})`;
}

function wrapNodeClassWithGuard(template) {
    const nodeClassRegex = /^(\s*)class Node\s*\{/gm;
    let match;
    let lastIndex = 0;
    let result = '';
    let found = false;
    while ((match = nodeClassRegex.exec(template)) !== null) {
        found = true;
        const before = template.slice(lastIndex, match.index);
        const indent = match[1];
        const guardOpen = `${indent}#ifndef NODE_DEFINED\n${indent}#define NODE_DEFINED\n`;
        let braceCount = 0;
        let i = match.index + match[0].length;
        let classEnd = i;
        while (i < template.length) {
            if (template[i] === '{') braceCount++;
            else if (template[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    classEnd = i + 1;
                    break;
                }
            }
            i++;
        }
        const classDefinition = template.slice(match.index, classEnd);
        const guardClose = `${indent}#endif // NODE_DEFINED\n`;
        result += before + guardOpen + classDefinition + guardClose;
        lastIndex = classEnd;
        break;
    }
    if (found) {
        result += template.slice(lastIndex);
        return result;
    }
    return template;
}

function generateRunner(language, userCode, metadata) {
    let template = loadTemplate(language);

    if (language === 'java') {
        userCode = stripImports(userCode);
    }

    template = template.replace('{{USER_CODE}}', userCode);
    template = template.replace(/{{METHOD_NAME}}/g, metadata.methodName || 'solve');
    template = template.replace(/{{CLASS_NAME}}/g, metadata.className || 'Solution');

    let interactiveLiteral;
    switch (language) {
        case 'python':
            interactiveLiteral = metadata.isInteractive ? 'True' : 'False';
            break;
        default:
            interactiveLiteral = metadata.isInteractive ? 'true' : 'false';
            break;
    }
    template = template.replace(/{{IS_INTERACTIVE}}/g, interactiveLiteral);

    const rawParamTypes = metadata.paramTypes || [];
    const transformedParamTypes = rawParamTypes.map(hint => transformTypeHint(hint, language));
    let paramTypesReplacement;
    if (language === 'java') {
        const jsonArray = JSON.stringify(transformedParamTypes);
        paramTypesReplacement = toJavaListInitializer(jsonArray);
    } else {
        paramTypesReplacement = JSON.stringify(transformedParamTypes);
    }
    template = template.replace('{{PARAM_TYPES}}', paramTypesReplacement);

    const rawReturnType = metadata.returnType || 'any';
    const transformedReturnType = transformTypeHint(rawReturnType, language);
    template = template.replace(/{{RETURN_TYPE}}/g, transformedReturnType);

    // ========== C++ specific fixes ==========
    if (language === 'cpp') {
        template = wrapNodeClassWithGuard(template);
        const paramCount = transformedParamTypes.length;
        const argExtractors = [];
        for (let i = 0; i < paramCount; i++) {
            const typeHint = transformedParamTypes[i];
            if (typeHint === 'int' || typeHint === 'long' || typeHint === 'double' || typeHint === 'float') {
                argExtractors.push(`args[${i}].as${typeHint.substr(0,1).toUpperCase() + typeHint.substr(1)}()`);
            } else if (typeHint === 'bool') {
                argExtractors.push(`args[${i}].asBool()`);
            } else if (typeHint === 'string') {
                argExtractors.push(`args[${i}].asString()`);
            } else if (typeHint === 'ListNode') {
                argExtractors.push(`args[${i}].asListNode()`);
            } else if (typeHint === 'TreeNode') {
                argExtractors.push(`args[${i}].asTreeNode()`);
            } else if (typeHint === 'Node') {
                argExtractors.push(`args[${i}].asNode()`);
            } else {
                argExtractors.push(`args[${i}]`);
            }
        }
        const argList = argExtractors.join(', ');
        const macroDefinition = `
// ==== Generated dispatch macros ====
#define DISPATCH_NON_INTERACTIVE(className, methodName, args) \\
    className sol; \\
    auto result = sol.methodName(${argList}); \\
    Any ret = Any(result); \\
    ret
#define DISPATCH_INTERACTIVE_CTOR(className, args, objPtr) \\
    objPtr = new className(/* args extraction would go here */)
#define DISPATCH_INTERACTIVE_METHOD(className, meth, objPtr, args) \\
    Any() // placeholder
// ==== End generated macros ====
`;
        const includePos = template.indexOf('#include <bits/stdc++.h>');
        if (includePos !== -1) {
            const endOfInclude = template.indexOf('\n', includePos) + 1;
            template = template.slice(0, endOfInclude) + macroDefinition + template.slice(endOfInclude);
        } else {
            template = macroDefinition + template;
        }
    }

    // ========== Java specific fixes ==========
    if (language === 'java') {
        const problematicLine = /List<\?> argsData = \(List<\?>\) call\.getOrDefault\("args", new ArrayList<>\(\)\);/g;
        const safeLine = 'List<?> argsData = (List<?>) call.get("args"); if (argsData == null) argsData = new ArrayList<Object>();';
        template = template.replace(problematicLine, safeLine);
    }

    // ========== Python specific fixes ==========
    if (language === 'python') {
        // 1. Fix empty list output for ListNode
        const returnType = transformedReturnType;
        if (returnType === 'ListNode' || returnType === 'Optional[ListNode]') {
            const nullPrintPattern = /if serialized is None:\s+print\("null"\)/g;
            const replacement = `if serialized is None:
                if return_type in ('ListNode', 'Optional[ListNode]'):
                    print("[]")
                else:
                    print("null")`;
            template = template.replace(nullPrintPattern, replacement);
        }

        // 2. Replace the faulty Node deserialization block with improved heuristic
        // Match the entire block from "if type_hint == 'Node':" to the next "elif" or "return"
        const nodeBlockRegex = /(if type_hint == 'Node':\s*(?:#.*\n)?\s*if isinstance\(data, list\) and len\(data\) > 0:\s*if isinstance\(data\[0\], list\) and len\(data\[0\]\) == 2:\s*# Random list.*?\n\s*return _deserialize_random_list\(data\)\s*else:\s*# Graph.*?\n\s*return _deserialize_graph_node\(data\)\s*return None)/s;
        const newNodeBlock = `if type_hint == 'Node':
        # Improved heuristic: distinguish graph adjacency list from random list
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            # If any inner list has length != 2 -> graph
            if any(len(inner) != 2 for inner in data):
                return _deserialize_graph_node(data)
            # All inner lists have length 2: check for null (random list)
            if any(inner[1] is None for inner in data):
                return _deserialize_random_list(data)
            else:
                # No nulls: assume graph adjacency list (1‑based indices)
                return _deserialize_graph_node(data)
        else:
            return _deserialize_graph_node(data)`;
        template = template.replace(nodeBlockRegex, newNodeBlock);

        // 3. Fix graph serializer to output correct adjacency list for a single node
        const graphSerializerPattern = /(def _serialize_graph_node\(node\):[\s\S]*?)(return JsonValue\(arr\))/;
        const fixedGraphSerializer = `def _serialize_graph_node(node):
    if not node:
        return []
    visited = set()
    nodes = []
    q = deque([node])
    while q:
        cur = q.popleft()
        if cur.val in visited:
            continue
        visited.add(cur.val)
        nodes.append(cur)
        for nb in cur.neighbors:
            if nb.val not in visited:
                q.append(nb)
    nodes.sort(key=lambda n: n.val)
    idx = {n.val: i+1 for i, n in enumerate(nodes)}
    res = []
    for n in nodes:
        neighbors = [idx[nb.val] for nb in n.neighbors]
        res.append(neighbors)
    # Ensure that a single node with no neighbors returns [[]]
    if len(res) == 1 and len(res[0]) == 0:
        return [[]]
    return res`;
        template = template.replace(graphSerializerPattern, fixedGraphSerializer);
    }

    return template;
}

module.exports = { generateRunner };