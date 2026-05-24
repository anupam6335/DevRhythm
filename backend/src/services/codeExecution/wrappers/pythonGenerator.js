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
    const { deserCode, callCode, interactiveMain } = this._generateExecutionCode(metadata);
    const imports = this._generateImports(metadata);
    const fullCode = `${imports}\n\n${helperCode}\n\n${userCode}\n\n${interactiveMain ? interactiveMain : this._buildNonInteractiveMain(deserCode, callCode)}\n`;

    return fullCode;
  }

  _getRequiredHelpers(dataStructures) {
    if (!dataStructures.length) return '';
    const structuresPath = path.join(__dirname, '../helpers/python/structures.py');
    try {
      return fs.readFileSync(structuresPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not read structures.py: ${err.message}`);
      return this._fallbackHelpers();
    }
  }

  _fallbackHelpers() {
    return `
# Minimal fallback helpers (should not be used in production)
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Node:
    def __init__(self, val=0, neighbors=None, next=None, random=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
        self.next = next
        self.random = random

class NestedInteger:
    def __init__(self, value=None):
        self.value = value
        self.list = []
    def isInteger(self): return self.value is not None
    def getInteger(self): return self.value
    def setInteger(self, value): self.value = value; self.list = []
    def add(self, ni): self.list.append(ni)
    def getList(self): return self.list

def deserialize_linked_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    cur = head
    for v in arr[1:]: cur.next = ListNode(v); cur = cur.next
    return head

def serialize_linked_list(head):
    res = []
    cur = head
    while cur: res.append(cur.val); cur = cur.next
    return res

def deserialize_tree(arr):
    if not arr: return None
    from collections import deque
    root = TreeNode(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

def serialize_tree(root):
    if not root: return []
    from collections import deque
    res = []
    q = deque([root])
    while q:
        node = q.popleft()
        if node:
            res.append(node.val)
            q.append(node.left)
            q.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None: res.pop()
    return res

def deserialize_graph(adj):
    if not adj: return None
    nodes = {}
    for i, neigh in enumerate(adj):
        val = i + 1
        if val not in nodes: nodes[val] = Node(val)
        for nb in neigh:
            if nb not in nodes: nodes[nb] = Node(nb)
            nodes[val].neighbors.append(nodes[nb])
    return nodes[1]

def serialize_graph(node):
    if not node: return []
    visited = set()
    order = []
    from collections import deque
    q = deque([node])
    while q:
        cur = q.popleft()
        if cur.val in visited: continue
        visited.add(cur.val)
        order.append(cur)
        for nb in cur.neighbors: q.append(nb)
    order.sort(key=lambda n: n.val)
    idx = {n.val: i+1 for i, n in enumerate(order)}
    return [[idx[nb.val] for nb in n.neighbors] for n in order]

def deserialize_random_list(arr):
    if not arr: return None
    nodes = [Node(pair[0]) for pair in arr]
    for i in range(len(nodes)-1): nodes[i].next = nodes[i+1]
    for i, pair in enumerate(arr):
        if pair[1] is not None: nodes[i].random = nodes[pair[1]]
    return nodes[0]

def serialize_random_list(head):
    if not head: return []
    idx = {}
    cur = head
    i = 0
    while cur:
        idx[cur] = i
        cur = cur.next
        i += 1
    res = []
    cur = head
    while cur:
        res.append([cur.val, idx.get(cur.random) if cur.random else None])
        cur = cur.next
    return res

def deserialize_node(obj):
    if not obj: return None
    if isinstance(obj, list) and len(obj) > 0 and isinstance(obj[0], list) and len(obj[0]) == 2:
        return deserialize_random_list(obj)
    return deserialize_graph(obj)

def serialize_node(node):
    if not node: return []
    if node.next is not None:
        return serialize_random_list(node)
    else:
        return serialize_graph(node)

def deserialize_nested_integer(data):
    if isinstance(data, int): return NestedInteger(data)
    if isinstance(data, list):
        ni = NestedInteger()
        for item in data: ni.add(deserialize_nested_integer(item))
        return ni
    return NestedInteger()

def serialize_nested_integer(ni):
    if ni.isInteger(): return ni.getInteger()
    return [serialize_nested_integer(child) for child in ni.getList()]
`;
  }

  _generateExecutionCode(metadata) {
    const { interactive, className, methodName, parameters, constructorParams, methods } = metadata;
    if (interactive) {
      return this._generateInteractive(className, constructorParams, methods);
    } else {
      const deserCode = this._generateDeserialization(parameters);
      const callCode = this._generateStandardCall(className, methodName, parameters);
      return { deserCode, callCode, interactiveMain: null };
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

  _generateStandardCall(className, methodName, parameters) {
    const argNames = parameters.map((_, i) => `arg_${i}`).join(', ');
    if (className) {
      return `        obj = ${className}()\n        result = obj.${methodName}(${argNames})`;
    } else {
      return `        result = ${methodName}(${argNames})`;
    }
  }

  _generateInteractive(className, constructorParams, methods) {
    const constrArgs = constructorParams.map((_, i) => `constr_args[${i}]`).join(', ');
    const dispatchLines = [];
    for (const m of methods) {
      const paramCount = m.parameters.length;
      const argsPlaceholder = paramCount > 0 ? `*method_args` : '';
      dispatchLines.push(`            if method_name == "${m.name}":`);
      dispatchLines.push(`                try:`);
      dispatchLines.push(`                    res = obj.${m.name}(${argsPlaceholder})`);
      dispatchLines.push(`                    results.append(res)`);
      dispatchLines.push(`                except Exception as e:`);
      dispatchLines.push(`                    sys.stderr.write(str(e))`);
      dispatchLines.push(`                    results.append(None)`);
      dispatchLines.push(`                continue`);
    }
    dispatchLines.push(`            results.append(None)  # unknown method`);

    const interactiveCode = `
def solve(input_str):
    import json
    import sys
    try:
        data = json.loads(input_str)
        constr_args = data.get("constructor", [])
        methods_list = data.get("methods", [])
        results = [None]
        obj = ${className}(${constrArgs})
        for call in methods_list:
            if not isinstance(call, list) or len(call) == 0:
                results.append(None)
                continue
            method_name = call[0]
            method_args = call[1:]
            ${dispatchLines.join('\n')}
        return json.dumps(results)
    except Exception as e:
        sys.stderr.write(str(e))
        return "null"
`;
    return { deserCode: '', callCode: '', interactiveMain: interactiveCode };
  }

  _buildNonInteractiveMain(deserCode, callCode) {
    return `
def solve(input_str):
    import json
    import sys
    try:
        data = json.loads(input_str)
        args = data.get("args", [])
${deserCode}
${callCode}
        # Serialise result
        if isinstance(result, (ListNode, TreeNode, Node, NestedInteger)):
            if isinstance(result, ListNode):
                return json.dumps(serialize_linked_list(result))
            elif isinstance(result, TreeNode):
                return json.dumps(serialize_tree(result))
            elif isinstance(result, Node):
                return json.dumps(serialize_node(result))
            elif isinstance(result, NestedInteger):
                return json.dumps(serialize_nested_integer(result))
        else:
            return json.dumps(result, default=str)
    except Exception as e:
        sys.stderr.write(str(e))
        return "null"
`;
  }

  _generateImports(metadata) {
    const imports = new Set(['import json', 'import sys']);
    if ((metadata.dataStructures || []).includes('TreeNode')) {
      imports.add('from collections import deque');
    }
    imports.add('from typing import List, Optional, Dict, Any, Set, Tuple');
    return Array.from(imports).join('\n');
  }
}

module.exports = PythonGenerator;