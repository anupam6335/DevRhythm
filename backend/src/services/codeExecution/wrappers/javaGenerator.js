const fs = require('fs');
const path = require('path');

/**
 * JavaGenerator - Produces a runnable Java program from user code and metadata.
 * Injects required helper classes and a Main driver with error handling.
 */
class JavaGenerator {
  generateWrapper(userCode, metadata, testCases) {
    if (!userCode || typeof userCode !== 'string') {
      throw new Error('Invalid user code');
    }
    if (!metadata || !metadata.methodName) {
      throw new Error('Invalid metadata: missing methodName');
    }

    // 1. Load required helper classes (as a single Java source block)
    const helpersCode = this._getRequiredHelpers(metadata.dataStructures || []);

    // 2. Generate the argument deserialization and method call code (for Main.main)
    const { deserCode, callCode, serializationCode } = this._generateExecutionCode(metadata);

    // 3. Build the Main class with JSON parser and main method
    const mainClass = this._buildMainClass(metadata, deserCode, callCode, serializationCode, testCases);

    // 4. Combine: imports (if any), helpers, user code, Main class
    const imports = this._generateImports(metadata);
    const finalCode = `${imports}

${helpersCode}

${userCode}

${mainClass}
`;

    return finalCode;
  }

  _getRequiredHelpers(dataStructures) {
    if (!dataStructures.length) return '';
    const helpersPath = path.join(__dirname, '../helpers/java/Structures.java');
    try {
      return fs.readFileSync(helpersPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not read Structures.java: ${err.message}`);
      return '';
    }
  }

  _generateExecutionCode(metadata) {
    const { className, methodName, parameters, returnType, interactive, methods, constructorParams } = metadata;
    if (interactive) {
      return this._generateInteractiveExecution(className, methods, constructorParams);
    } else {
      return this._generateStandardExecution(className, methodName, parameters, returnType);
    }
  }

  _generateStandardExecution(className, methodName, parameters, returnType) {
    // Deserialize each argument using helper functions
    const deserLines = [];
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
      deserLines.push(`        ${this._javaTypeCast(type)} arg${i} = ${deserExpr};`);
    }
    const deserCode = deserLines.join('\n');

    // Method call with try-catch
    let callLine;
    if (className) {
      callLine = `        ${className} obj = new ${className}();
        try {
            ${returnType === "void" ? "" : returnType + " result = "}obj.${methodName}(${parameters.map((_, i) => `arg${i}`).join(", ")});
            ${this._serializeResult(returnType, "result")}
        } catch (Exception e) {
            System.err.println(e.toString());
        }`;
    } else {
      callLine = `        try {
            ${returnType === "void" ? "" : returnType + " result = "}${methodName}(${parameters.map((_, i) => `arg${i}`).join(", ")});
            ${this._serializeResult(returnType, "result")}
        } catch (Exception e) {
            System.err.println(e.toString());
        }`;
    }

    return { deserCode, callCode: callLine, serializationCode: '' };
  }

  _generateInteractiveExecution(className, methods, constructorParams) {
    // Build code that reads JSON input, instantiates class, and executes methods sequentially with error handling.
    const constructorArgTypes = constructorParams.map(t => this._javaTypeFromString(t));
    const instantiation = `        ${className} obj = null;
        try {
            obj = new ${className}(${constructorParams.map((_, i) => `((${constructorArgTypes[i]})constrArgs.get(${i}))`).join(", ")});
        } catch (Exception e) {
            System.err.println(e.toString());
            return;
        }`;
    const methodDispatch = methods.map(m => {
      const paramTypes = m.parameters.map(p => this._javaTypeFromString(p));
      return `                    if (methodName.equals("${m.name}")) {
                        try {
                            ${m.returnType === "void" ? "" : m.returnType + " res = "}obj.${m.name}(${paramTypes.map((_, i) => `((${paramTypes[i]})methodArgs.get(${i}))`).join(", ")});
                            results.add(${m.returnType === "void" ? "null" : "res"});
                        } catch (Exception e) {
                            System.err.println(e.toString());
                            results.add(null);
                        }
                    } else`;
    }).join(' ');
    const finalElse = ` else {
                        results.add(null);
                    }`;
    const dispatchCode = methodDispatch + finalElse;

    const serialization = `        System.out.print(serialize(results));`;

    const deserCode = `
        Map<String, Object> data = parser.parseObject();
        List<Object> constrArgs = (List<Object>) data.get("constructor");
        List<List<Object>> methodsList = (List<List<Object>>) data.get("methods");
        List<Object> results = new ArrayList<>();
        results.add(null);
        ${instantiation}
        for (List<Object> call : methodsList) {
            if (call == null || call.isEmpty()) {
                results.add(null);
                continue;
            }
            String methodName = (String) call.get(0);
            List<Object> methodArgs = call.subList(1, call.size());
            ${dispatchCode}
        }`;
    return { deserCode, callCode: '', serializationCode: serialization };
  }

  _serializeResult(returnType, resultVar) {
    if (returnType === "void") {
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

  _buildMainClass(metadata, deserCode, callCode, serializationCode, testCases) {
    const parserClass = this._generateJsonParser();
    const testCasesCode = this._generateTestCasesRunner(testCases, metadata.interactive);
    return `
public class Main {
    ${parserClass}

    // Helper methods for deserialization/serialization (will be added by the helpers file)

    public static void main(String[] args) throws Exception {
        java.util.Scanner scanner = new java.util.Scanner(System.in);
        StringBuilder inputBuilder = new StringBuilder();
        while (scanner.hasNextLine()) {
            inputBuilder.append(scanner.nextLine());
        }
        String input = inputBuilder.toString();
        ${testCasesCode}
    }

    ${this._generateLegacyParser()}
}
`;
  }

  _generateTestCasesRunner(testCases, interactive) {
    if (interactive) {
      const testCaseStrs = testCases.map(tc => tc.stdin.replace(/\\/g, "\\\\").replace(/"/g, '\\"'));
      const arrayJson = JSON.stringify(testCaseStrs);
      return `
        String[] testInputs = ${arrayJson};
        java.util.List<String> outputs = new java.util.ArrayList<>();
        for (String inp : testInputs) {
            try {
                JSONParser parser = new JSONParser(inp);
                Object parsed = parser.parse();
                Map<String, Object> data;
                if (parsed instanceof Map) {
                    data = (Map<String, Object>) parsed;
                } else {
                    data = new java.util.HashMap<>();
                    data.put("args", parsed);
                }
                ${this._generateInteractiveExecutionCode().deserCode}
                ${this._generateInteractiveExecutionCode().serializationCode}
                outputs.add(out.toString());
            } catch (Exception e) {
                outputs.add("ERROR: " + e.toString());
            }
        }
        System.out.print(serialize(outputs));
`;
    } else {
      const testCaseStrs = testCases.map(tc => tc.stdin.replace(/\\/g, "\\\\").replace(/"/g, '\\"'));
      const arrayJson = JSON.stringify(testCaseStrs);
      return `
        String[] testInputs = ${arrayJson};
        for (String inp : testInputs) {
            try {
                JSONParser parser = new JSONParser(inp);
                Object parsed = parser.parse();
                Map<String, Object> data;
                if (parsed instanceof Map) {
                    data = (Map<String, Object>) parsed;
                } else {
                    data = new java.util.HashMap<>();
                    data.put("args", parsed);
                }
                List<Object> argsArray = (List<Object>) data.get("args");
                ${deserCode}
                ${callCode}
            } catch (Exception e) {
                System.err.println(e.toString());
            }
            System.out.println();
        }
`;
    }
  }

  _generateJsonParser() {
    // Same as before, but ensure it's self-contained
    return `
    static class JSONParser {
        private String json;
        private int pos;
        private int len;
        public JSONParser(String json) { this.json = json; this.pos = 0; this.len = json.length(); }
        public Object parse() { skipWhitespace(); return parseValue(); }
        private void skipWhitespace() { while (pos < len && Character.isWhitespace(json.charAt(pos))) pos++; }
        private Object parseValue() {
            skipWhitespace();
            char c = json.charAt(pos);
            if (c == '{') return parseObject();
            if (c == '[') return parseArray();
            if (c == '"') return parseString();
            if (c == 't' || c == 'f') return parseBoolean();
            if (c == 'n') return parseNull();
            return parseNumber();
        }
        private Map<String, Object> parseObject() {
            Map<String, Object> obj = new java.util.HashMap<>();
            pos++;
            skipWhitespace();
            if (json.charAt(pos) == '}') { pos++; return obj; }
            while (true) {
                skipWhitespace();
                String key = parseString();
                skipWhitespace();
                if (json.charAt(pos) != ':') throw new RuntimeException("Expected ':'");
                pos++;
                Object value = parseValue();
                obj.put(key, value);
                skipWhitespace();
                char next = json.charAt(pos);
                if (next == '}') { pos++; break; }
                if (next != ',') throw new RuntimeException("Expected ',' or '}'");
                pos++;
            }
            return obj;
        }
        private List<Object> parseArray() {
            List<Object> arr = new java.util.ArrayList<>();
            pos++;
            skipWhitespace();
            if (json.charAt(pos) == ']') { pos++; return arr; }
            while (true) {
                arr.add(parseValue());
                skipWhitespace();
                char next = json.charAt(pos);
                if (next == ']') { pos++; break; }
                if (next != ',') throw new RuntimeException("Expected ',' or ']'");
                pos++;
            }
            return arr;
        }
        private String parseString() {
            pos++;
            StringBuilder sb = new StringBuilder();
            while (pos < len && json.charAt(pos) != '"') {
                char c = json.charAt(pos);
                if (c == '\\\\') {
                    pos++;
                    c = json.charAt(pos);
                    switch (c) {
                        case '"': sb.append('"'); break;
                        case '\\\\': sb.append('\\\\'); break;
                        case '/': sb.append('/'); break;
                        case 'b': sb.append('\\b'); break;
                        case 'f': sb.append('\\f'); break;
                        case 'n': sb.append('\\n'); break;
                        case 'r': sb.append('\\r'); break;
                        case 't': sb.append('\\t'); break;
                        default: sb.append(c);
                    }
                } else {
                    sb.append(c);
                }
                pos++;
            }
            if (pos >= len || json.charAt(pos) != '"') throw new RuntimeException("Unterminated string");
            pos++;
            return sb.toString();
        }
        private Boolean parseBoolean() {
            if (json.startsWith("true", pos)) { pos += 4; return true; }
            if (json.startsWith("false", pos)) { pos += 5; return false; }
            throw new RuntimeException("Invalid boolean");
        }
        private Object parseNull() {
            if (json.startsWith("null", pos)) { pos += 4; return null; }
            throw new RuntimeException("Invalid null");
        }
        private Number parseNumber() {
            int start = pos;
            while (pos < len && (Character.isDigit(json.charAt(pos)) || json.charAt(pos) == '.' || json.charAt(pos) == '-' || json.charAt(pos) == 'e' || json.charAt(pos) == 'E')) pos++;
            String numStr = json.substring(start, pos);
            if (numStr.contains(".") || numStr.contains("e") || numStr.contains("E")) return Double.parseDouble(numStr);
            else return Long.parseLong(numStr);
        }
    }
`;
  }

  _generateLegacyParser() {
    return `
    private static List<Object> parseLegacyInput(String input) {
        // Not used because we always send JSON; kept to avoid errors.
        return new java.util.ArrayList<>();
    }
`;
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
    if (type.contains("List")) return "List<?>";
    return "Object";
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

  _generateImports(metadata) {
    return "import java.util.*;";
  }

  _generateInteractiveExecutionCode() {
    // Dummy method to satisfy earlier call; actual code is generated inline.
    return { deserCode: "", serializationCode: "" };
  }
}

module.exports = JavaGenerator;