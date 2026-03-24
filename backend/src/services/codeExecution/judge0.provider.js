const axios = require('axios');
const BaseCodeExecutionProvider = require('./base.provider');

const LANGUAGE_IDS = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
};

// Templates with placeholders for user code
const TEMPLATES = {
  cpp: `
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <unordered_map>
#include <set>
#include <algorithm>
#include <sstream>
using namespace std;

string solve(string input) {
    // --- USER CODE START ---
{{USER_CODE}}
    // --- USER CODE END ---
}

int main() {
    string input, line;
    while (getline(cin, line)) {
        input += line + "\\n";
    }
    string output = solve(input);
    cout << output;
    return 0;
}
`,
  python: `
{{USER_CODE}}

if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read()
    output = solve(input_data)
    sys.stdout.write(output)
`,
  java: `
import java.util.*;

public class Main {
    public static String solve(String user_input) {
        // --- USER CODE START ---
{{USER_CODE}}
        // --- USER CODE END ---
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        StringBuilder inputBuilder = new StringBuilder();
        while (scanner.hasNextLine()) {
            inputBuilder.append(scanner.nextLine()).append("\\n");
        }
        String output = solve(inputBuilder.toString());
        System.out.print(output);
    }
}
`,
  javascript: `
const fs = require('fs');

function solve(user_input) {
    // --- USER CODE START ---
{{USER_CODE}}
    // --- USER CODE END ---
}

const input = fs.readFileSync(0, 'utf-8');
const output = solve(input);
process.stdout.write(output);
`,
};

class Judge0Provider extends BaseCodeExecutionProvider {
  constructor(apiUrl, cpuTimeLimit, memoryLimit) {
    super();
    this.apiUrl = apiUrl;
    this.cpuTimeLimit = cpuTimeLimit;
    this.memoryLimit = memoryLimit;
  }

  async execute({ language, code, stdin }) {

    const langId = LANGUAGE_IDS[language];
    if (!langId) throw new Error(`Unsupported language: ${language}`);

    const template = TEMPLATES[language];
    if (!template) throw new Error(`Template missing for language: ${language}`);

    // For Python, user code is inserted at top level (no extra indentation)
    // For other languages, indent each line by 4 spaces to fit inside the function
    let insertedCode = code;
    if (language !== 'python') {
      const indent = ' '.repeat(4);
      insertedCode = code.split('\n').map(line => line ? indent + line : line).join('\n');
    }

    // Replace the placeholder with the (possibly indented) user code
    const sourceCode = template.replace('{{USER_CODE}}', insertedCode);

    const payload = {
      source_code: sourceCode,
      language_id: langId,
      stdin: stdin || '',
      cpu_time_limit: this.cpuTimeLimit,
      memory_limit: this.memoryLimit,
    };

    const url = `${this.apiUrl}/submissions?wait=true&fields=stdout,stderr,compile_output,status`;

    try {
      const response = await axios.post(url, payload, {
        timeout: Math.max(10000, (this.cpuTimeLimit + 2) * 1000),
      });
      const result = response.data;
      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      const compileOutput = result.compile_output || '';
      const exitCode = result.status?.id === 3 ? 0 : 1;

      const errorMsg = compileOutput ? compileOutput : (stderr || undefined);

      return {
        stdout,
        stderr: errorMsg || stderr,
        exitCode,
        compileOutput,
      };
    } catch (error) {
      console.error('Judge0 execution error:', error.message);
      return {
        stdout: '',
        stderr: error.response?.data?.message || error.message,
        exitCode: 1,
        error: 'Execution service error',
      };
    }
  }
}

module.exports = Judge0Provider;