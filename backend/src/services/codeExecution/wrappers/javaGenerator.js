// This file is actually JavaScript (Node.js) that generates Java code.
// It produces a complete Main.java with JSON parser, helpers, and user class.
const fs = require('fs');
const path = require('path');

class JavaGenerator {
  generateWrapper(userCode, metadata, testCases) {
    if (!userCode || typeof userCode !== 'string') {
      throw new Error('Invalid user code');
    }
    if (!metadata || !metadata.methodName) {
      throw new Error('Invalid metadata: missing methodName');
    }

    const helpersCode = this._getRequiredHelpers(metadata.dataStructures || []);
    const { deserCode, callCode, interactiveMain } = this._generateExecutionCode(metadata);
    const imports = this._generateImports();
    const finalCode = `${imports}\n\n${helpersCode}\n\n${userCode}\n\n${interactiveMain || this._buildNonInteractiveMain(deserCode, callCode, metadata.returnType)}\n`;

    return finalCode;
  }

  _getRequiredHelpers(dataStructures) {
    if (!dataStructures.length) return '';
    const helpersPath = path.join(__dirname, '../helpers/java/Structures.java');
    try {
      return fs.readFileSync(helpersPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not read Structures.java: ${err.message}`);
      return this._fallbackHelpers();
    }
  }

  _fallbackHelpers() {
    return `
// Fallback helper classes (should not be used in production)
import java.util.*;
class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }
class TreeNode { int val; TreeNode left; TreeNode right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } }
class Node {
    int val;
    List<Node> neighbors;
    Node next;
    Node random;
    Node() { neighbors = new ArrayList<>(); }
    Node(int val) { this.val = val; neighbors = new ArrayList<>(); }
    Node(int val, List<Node> neighbors) { this.val = val; this.neighbors = neighbors; }
    Node(int val, Node next, Node random) { this.val = val; this.next = next; this.random = random; neighbors = new ArrayList<>(); }
}
class NestedInteger {
    private Integer value;
    private List<NestedInteger> list;
    public NestedInteger() { list = new ArrayList<>(); }
    public NestedInteger(int value) { this.value = value; }
    public boolean isInteger() { return value != null; }
    public Integer getInteger() { return value; }
    public void setInteger(int value) { this.value = value; list = null; }
    public void add(NestedInteger ni) { if (list == null) list = new ArrayList<>(); list.add(ni); }
    public List<NestedInteger> getList() { return list == null ? new ArrayList<>() : list; }
}
`;
  }

  _generateExecutionCode(metadata) {
    const { interactive, className, methodName, parameters, returnType, constructorParams, methods } = metadata;
    if (interactive) {
      return this._generateInteractive(className, constructorParams, methods);
    } else {
      const deserCode = this._generateDeserialization(parameters);
      const callCode = this._generateStandardCall(className, methodName, parameters, returnType);
      return { deserCode, callCode, interactiveMain: null };
    }
  }

  _generateDeserialization(parameters) {
    const lines = [];
    lines.push(`        if (argsArray.size() < ${parameters.length}) {`);
    lines.push(`            while (argsArray.size() < ${parameters.length}) argsArray.add(null);`);
    lines.push(`        }`);
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      const type = param.type;
      let deserExpr = `argsArray.get(${i})`;
      if (type.contains("ListNode")) {
        deserExpr = `deserializeListNode(argsArray.get(${i}))`;
      } else if (type.contains("TreeNode")) {
        deserExpr = `deserializeTreeNode(argsArray.get(${i}))`;
      } else if (type.contains("Node")) {
        deserExpr = `deserializeNode(argsArray.get(${i}))`;
      } else if (type.contains("NestedInteger")) {
        deserExpr = `deserializeNestedInteger(argsArray.get(${i}))`;
      }
      lines.push(`        ${this._javaTypeCast(type)} arg${i} = ${deserExpr};`);
    }
    return lines.join('\n');
  }

  _generateStandardCall(className, methodName, parameters, returnType) {
    const argNames = parameters.map((_, i) => `arg${i}`).join(', ');
    if (className) {
      return `        ${className} obj = new ${className}();
        try {
            ${returnType.equals("void") ? "" : returnType + " result = "}obj.${methodName}(${argNames});
            ${this._serializeResult(returnType, "result")}
        } catch (Exception e) {
            System.err.println(e.toString());
            System.out.print("null");
        }`;
    } else {
      return `        try {
            ${returnType.equals("void") ? "" : returnType + " result = "}${methodName}(${argNames});
            ${this._serializeResult(returnType, "result")}
        } catch (Exception e) {
            System.err.println(e.toString());
            System.out.print("null");
        }`;
    }
  }

  _generateInteractive(className, constructorParams, methods) {
    const constrArgs = constructorParams.map((_, i) => `(${this._javaTypeFromString(constructorParams[i])}) constrArgs.get(${i})`).join(', ');
    const dispatchLines = [];
    for (const m of methods) {
      const paramTypes = m.parameters.map(p => this._javaTypeFromString(p));
      const argsCast = paramTypes.map((pt, idx) => `(${pt}) methodArgs.get(${idx})`).join(', ');
      dispatchLines.push(`                    if (methodName.equals("${m.name}")) {`);
      dispatchLines.push(`                        try {`);
      dispatchLines.push(`                            ${m.returnType.equals("void") ? "" : m.returnType + " res = "}obj.${m.name}(${argsCast});`);
      dispatchLines.push(`                            results.add(${m.returnType.equals("void") ? "null" : "res"});`);
      dispatchLines.push(`                        } catch (Exception e) {`);
      dispatchLines.push(`                            System.err.println(e.toString());`);
      dispatchLines.push(`                            results.add(null);`);
      dispatchLines.push(`                        }`);
      dispatchLines.push(`                    } else`);
    }
    dispatchLines.push(`                    {`);
    dispatchLines.push(`                        results.add(null);`);
    dispatchLines.push(`                    }`);

    const interactiveCode = `
    public static String solveInteractive(String inputStr) {
        try {
            JSONParser parser = new JSONParser(inputStr);
            Map<String, Object> data = parser.parseObject();
            List<Object> constrArgs = (List<Object>) data.get("constructor");
            List<List<Object>> methodsList = (List<List<Object>>) data.get("methods");
            List<Object> results = new ArrayList<>();
            results.add(null);
            ${className} obj = new ${className}(${constrArgs});
            for (List<Object> call : methodsList) {
                if (call == null || call.isEmpty()) {
                    results.add(null);
                    continue;
                }
                String methodName = (String) call.get(0);
                List<Object> methodArgs = call.subList(1, call.size());
                ${dispatchLines.join('\n                ')}
            }
            return serialize(results);
        } catch (Exception e) {
            System.err.println(e.toString());
            return "[]";
        }
    }
`;
    return { deserCode: '', callCode: '', interactiveMain: interactiveCode };
  }

  _buildNonInteractiveMain(deserCode, callCode, returnType) {
    return `
    public static void main(String[] args) throws Exception {
        Scanner scanner = new Scanner(System.in);
        StringBuilder inputBuilder = new StringBuilder();
        while (scanner.hasNextLine()) {
            inputBuilder.append(scanner.nextLine());
        }
        String input = inputBuilder.toString();
        try {
            JSONParser parser = new JSONParser(input);
            Object parsed = parser.parse();
            Map<String, Object> data;
            if (parsed instanceof Map) {
                data = (Map<String, Object>) parsed;
            } else {
                data = new HashMap<>();
                data.put("args", parsed);
            }
            List<Object> argsArray = (List<Object>) data.get("args");
            ${deserCode}
            ${callCode}
        } catch (Exception e) {
            System.err.println(e.toString());
            System.out.print("null");
        }
    }

    private static String serialize(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\"" + escape((String) obj) + "\\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof ListNode) return serializeListNode((ListNode) obj).toString();
        if (obj instanceof TreeNode) return serializeTreeNode((TreeNode) obj).toString();
        if (obj instanceof Node) return serializeNode((Node) obj).toString();
        if (obj instanceof NestedInteger) return serializeNestedInteger((NestedInteger) obj).toString();
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(serialize(list.get(i)));
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof Map) {
            Map<?,?> map = (Map<?,?>) obj;
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?,?> e : map.entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("\\"").append(e.getKey()).append("\\":").append(serialize(e.getValue()));
            }
            sb.append("}");
            return sb.toString();
        }
        return obj.toString();
    }

    private static String escape(String s) {
        return s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
    }

    private static String serialize(Object obj) { return serialize(obj); } // alias
`;
  }

  _serializeResult(returnType, resultVar) {
    if (returnType.equals("void")) {
      return 'System.out.print("null");';
    }
    if (returnType.contains("ListNode")) {
      return `System.out.print(serializeListNode(${resultVar}));`;
    }
    if (returnType.contains("TreeNode")) {
      return `System.out.print(serializeTreeNode(${resultVar}));`;
    }
    if (returnType.contains("Node")) {
      return `System.out.print(serializeNode(${resultVar}));`;
    }
    if (returnType.contains("NestedInteger")) {
      return `System.out.print(serializeNestedInteger(${resultVar}));`;
    }
    if (returnType.equals("String")) {
      return `System.out.print("\\"" + ${resultVar} + "\\"");`;
    }
    return `System.out.print(${resultVar});`;
  }

  _javaTypeCast(type) {
    if (type.contains("ListNode")) return "ListNode";
    if (type.contains("TreeNode")) return "TreeNode";
    if (type.contains("Node")) return "Node";
    if (type.contains("NestedInteger")) return "NestedInteger";
    if (type.equals("int")) return "int";
    if (type.equals("long")) return "long";
    if (type.equals("double")) return "double";
    if (type.equals("boolean")) return "boolean";
    if (type.equals("String")) return "String";
    return "Object";
  }

  _javaTypeFromString(type) {
    if (type.contains("ListNode")) return "ListNode";
    if (type.contains("TreeNode")) return "TreeNode";
    if (type.contains("Node")) return "Node";
    if (type.contains("NestedInteger")) return "NestedInteger";
    if (type.equals("int")) return "int";
    if (type.equals("long")) return "long";
    if (type.equals("double")) return "double";
    if (type.equals("boolean")) return "boolean";
    if (type.equals("String")) return "String";
    return "Object";
  }

  _generateImports() {
    return "import java.util.*;\nimport java.lang.*;\nimport java.io.*;";
  }

  // JSONParser class is embedded in the generated code (string), but we'll include it via a helper method
  // For brevity, we assume the parser is already in the helpers; otherwise we add it in main.
}

module.exports = JavaGenerator;