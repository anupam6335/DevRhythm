const fs = require('fs');
const path = require('path');

/**
 * JsGenerator - Produces a runnable JavaScript/Node.js program from user code and metadata.
 * Injects required helper functions and a main() entry point with error handling.
 */
class JsGenerator {
  generateWrapper(userCode, metadata, testCases) {
    if (!userCode || typeof userCode !== 'string') {
      throw new Error('Invalid user code');
    }
    if (!metadata || !metadata.methodName) {
      throw new Error('Invalid metadata: missing methodName');
    }

    // 1. Load required data structure helpers
    const helpersCode = this._getRequiredHelpers(metadata.dataStructures || []);

    // 2. Generate argument deserialization and method call code
    const { deserCode, callCode, serializationCode } = this._generateExecutionCode(metadata);

    // 3. Build the main() function that reads stdin, processes test cases
    const mainCode = this._buildMain(metadata, deserCode, callCode, serializationCode, testCases);

    // 4. Combine: helpers, user code, main()
    const finalScript = `${helpersCode}

${userCode}

${mainCode}
`;

    return finalScript;
  }

  _getRequiredHelpers(dataStructures) {
    if (!dataStructures.length) return '';
    const helpersPath = path.join(__dirname, '../helpers/js/structures.js');
    try {
      return fs.readFileSync(helpersPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not read structures.js: ${err.message}`);
      return this._generateFallbackHelpers();
    }
  }

  _generateFallbackHelpers() {
    // Minimal data structure helpers (used if structures.js not found)
    return `
// Minimal data structure helpers
class ListNode { constructor(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; } }
class TreeNode { constructor(val, left, right) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; } }
class Node { constructor(val, neighbors, next, random) { this.val = val === undefined ? 0 : val; this.neighbors = neighbors === undefined ? [] : neighbors; this.next = next === undefined ? null : next; this.random = random === undefined ? null : random; } }
class NestedInteger { constructor(value) { this._isInt = (value !== undefined && typeof value === 'number'); this._value = this._isInt ? value : null; this._list = this._isInt ? null : []; } isInteger() { return this._isInt; } getInteger() { return this._value; } setInteger(value) { this._isInt = true; this._value = value; this._list = null; } add(ni) { if (this._isInt) { this._isInt = false; this._list = []; this._value = null; } this._list.push(ni); } getList() { return this._list || []; } }
function deserializeLinkedList(arr) { if (!arr) return null; let head = new ListNode(arr[0]); let cur = head; for (let i=1;i<arr.length;i++) { cur.next = new ListNode(arr[i]); cur = cur.next; } return head; }
function serializeLinkedList(head) { let res = []; while (head) { res.push(head.val); head = head.next; } return res; }
function deserializeTree(arr) { if (!arr.length) return null; let nodes = arr.map(v => v===null?null:new TreeNode(v)); let kids = nodes.slice().reverse(); let root = kids.pop(); for (let node of nodes) { if (node) { if (kids.length) node.left = kids.pop(); if (kids.length) node.right = kids.pop(); } } return root; }
function serializeTree(root) { if (!root) return []; let q = [root]; let res = []; while (q.length) { let node = q.shift(); if (node) { res.push(node.val); q.push(node.left); q.push(node.right); } else { res.push(null); } } while (res.length && res[res.length-1] === null) res.pop(); return res; }
function deserializeGraph(adjList) { if (!adjList) return null; let nodes = {}; for (let i=0;i<adjList.length;i++) { let val=i+1; if(!nodes[val]) nodes[val]=new Node(val); for(let nb of adjList[i]) { if(!nodes[nb]) nodes[nb]=new Node(nb); nodes[val].neighbors.push(nodes[nb]); } } return nodes[1]; }
function serializeGraph(node) { if (!node) return []; let visited=new Set(), order=[], q=[node]; while(q.length){ let cur=q.shift(); if(visited.has(cur.val)) continue; visited.add(cur.val); order.push(cur); for(let nb of cur.neighbors) q.push(nb); } order.sort((a,b)=>a.val-b.val); let idx={}; order.forEach((n,i)=>idx[n.val]=i+1); return order.map(n=>n.neighbors.map(nb=>idx[nb.val])); }
function deserializeRandomList(arr) { if(!arr) return null; let nodes=arr.map(pair=>new Node(pair[0])); for(let i=0;i<nodes.length-1;i++) nodes[i].next=nodes[i+1]; for(let i=0;i<arr.length;i++) { if(arr[i][1]!==null) nodes[i].random=nodes[arr[i][1]]; } return nodes[0]; }
function serializeRandomList(head) { if(!head) return []; let idx=new Map(), cur=head, i=0; while(cur){ idx.set(cur,i++); cur=cur.next; } let res=[]; cur=head; while(cur){ res.push([cur.val, idx.get(cur.random)??null]); cur=cur.next; } return res; }
function deserializeNode(obj){ if(!obj) return null; if(Array.isArray(obj) && obj.length && Array.isArray(obj[0]) && obj[0].length===2) return deserializeRandomList(obj); return deserializeGraph(obj); }
function serializeNode(node){ if(!node) return []; if(node.next!==undefined && node.next!==null) return serializeRandomList(node); return serializeGraph(node); }
function deserializeNestedInteger(data){ if(typeof data==='number') return new NestedInteger(data); if(Array.isArray(data)){ let ni=new NestedInteger(); for(let item of data) ni.add(deserializeNestedInteger(item)); return ni; } return new NestedInteger(); }
function serializeNestedInteger(ni){ if(ni.isInteger()) return ni.getInteger(); return ni.getList().map(child=>serializeNestedInteger(child)); }
`;
  }

  _generateExecutionCode(metadata) {
    const { className, methodName, parameters, interactive, methods, constructorParams } = metadata;
    if (interactive) {
      return this._generateInteractiveExecution(className, methods, constructorParams);
    } else {
      return this._generateStandardExecution(className, methodName, parameters);
    }
  }

  _generateStandardExecution(className, methodName, parameters) {
    // Deserialize each argument
    const deserLines = [];
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      const paramName = param.name;
      let deserExpr = `args[${i}]`;
      if (paramName.toLowerCase().includes('head') || paramName.toLowerCase().includes('list')) {
        deserExpr = `deserializeLinkedList(args[${i}])`;
      } else if (paramName.toLowerCase().includes('root') || paramName.toLowerCase().includes('tree')) {
        deserExpr = `deserializeTree(args[${i}])`;
      } else if (paramName.toLowerCase().includes('graph') || paramName.toLowerCase().includes('adj')) {
        deserExpr = `deserializeGraph(args[${i}])`;
      } else if (paramName.toLowerCase().includes('node') && param.type !== 'ListNode') {
        deserExpr = `deserializeNode(args[${i}])`;
      }
      deserLines.push(`    const arg${i} = ${deserExpr};`);
    }
    const deserCode = deserLines.join('\n');

    // Method call with error handling
    let callLine;
    if (className) {
      callLine = `    let result;
    try {
        const obj = new ${className}();
        result = obj.${methodName}(${parameters.map((_, i) => `arg${i}`).join(', ')});
    } catch (err) {
        process.stderr.write(err.toString());
        result = null;
    }`;
    } else {
      callLine = `    let result;
    try {
        result = ${methodName}(${parameters.map((_, i) => `arg${i}`).join(', ')});
    } catch (err) {
        process.stderr.write(err.toString());
        result = null;
    }`;
    }

    // Serialization
    const serializationCode = `    try {
        const serialized = JSON.stringify(result, (key, value) => {
            if (value && typeof value === 'object') {
                if (value.val !== undefined && value.next !== undefined) return serializeLinkedList(value);
                if (value.val !== undefined && (value.left !== undefined || value.right !== undefined)) return serializeTree(value);
                if (value.val !== undefined && value.neighbors !== undefined) return serializeGraph(value);
                if (value.val !== undefined && (value.next !== undefined || value.random !== undefined)) return serializeRandomList(value);
                if (value.isInteger && value.getList) return serializeNestedInteger(value);
            }
            return value;
        });
        return serialized;
    } catch (err) {
        process.stderr.write(err.toString());
        return "null";
    }`;
    return { deserCode, callCode: callLine, serializationCode };
  }

  _generateInteractiveExecution(className, methods, constructorParams) {
    // Build code that reads JSON input, instantiates class, executes methods sequentially with error handling.
    const instantiation = `    let obj = null;
    try {
        obj = new ${className}(${constructorParams.map((_, i) => `constrArgs[${i}]`).join(', ')});
    } catch (err) {
        process.stderr.write(err.toString());
        return JSON.stringify([]);
    }`;
    const dispatch = methods.map(m => {
      return `        if (methodName === "${m.name}") {
            try {
                const res = obj.${m.name}(${m.parameters.map((_, i) => `methodArgs[${i}]`).join(', ')});
                results.push(res);
            } catch (err) {
                process.stderr.write(err.toString());
                results.push(null);
            }
        } else`;
    }).join(' ') + ` {
            results.push(null);
        }`;
    const serialization = `    return JSON.stringify(results);`;

    const deserCode = `
    let data;
    try {
        data = JSON.parse(inputStr);
    } catch (err) {
        process.stderr.write(err.toString());
        return "[]";
    }
    const constrArgs = data.constructor || [];
    const methodsList = data.methods || [];
    const results = [null];
    ${instantiation}
    for (const call of methodsList) {
        if (!Array.isArray(call) || call.length === 0) {
            results.push(null);
            continue;
        }
        const methodName = call[0];
        const methodArgs = call.slice(1);
        ${dispatch}
    }
    ${serialization}
`;
    return { deserCode, callCode: '', serializationCode: '' };
  }

  _buildMain(metadata, deserCode, callCode, serializationCode, testCases) {
    const interactive = metadata.interactive;
    const testCaseStrs = testCases.map(tc => tc.stdin.replace(/\\/g, '\\\\').replace(/"/g, '\\"'));
    const testArrayJson = JSON.stringify(testCaseStrs);

    if (interactive) {
      return `
const fs = require('fs');

function main() {
    const testInputs = ${testArrayJson};
    const outputs = [];
    for (const inp of testInputs) {
        try {
            const out = solve(inp);
            outputs.push(out);
        } catch (e) {
            outputs.push(JSON.stringify({ error: e.toString() }));
        }
    }
    process.stdout.write(JSON.stringify(outputs));
}

function solve(inputStr) {
    ${deserCode}
    ${callCode}
    ${serializationCode}
}

if (require.main === module) {
    main();
}
`;
    } else {
      return `
const fs = require('fs');

function main() {
    const testInputs = ${testArrayJson};
    for (const inp of testInputs) {
        try {
            const out = solve(inp);
            process.stdout.write(out + "\\n");
        } catch (e) {
            process.stderr.write(e.toString() + "\\n");
        }
    }
}

function solve(inputStr) {
    let parsed;
    try {
        parsed = JSON.parse(inputStr);
    } catch (err) {
        process.stderr.write(err.toString());
        return "null";
    }
    const args = parsed.args || [];
    ${deserCode}
    ${callCode}
    ${serializationCode}
}

if (require.main === module) {
    main();
}
`;
    }
  }
}

module.exports = JsGenerator;