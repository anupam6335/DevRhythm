function parseStdin(stdin) {
  const parts = stdin.split(',').map(p => p.trim());
  const args = {};
  for (const part of parts) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      try {
        args[key] = eval(`(${value})`);
      } catch (e) {
        args[key] = value;
      }
    }
  }
  return args;
}

function generatePython(stub, testCases) {
  const imports = ['from typing import List'];
  if (!stub.includes('List')) imports.push('from typing import List');
  const importBlock = imports.join('\n');

  const testBlock = [];
  testCases.forEach((tc, idx) => {
    const args = parseStdin(tc.stdin);
    const argList = Object.values(args).map(v => JSON.stringify(v)).join(', ');
    // Extract method name from stub (assuming it's the first method in the class)
    const methodName = stub.match(/def\s+(\w+)\(/)?.[1] || 'function';
    testBlock.push(`    print("Test case ${idx+1}:")`);
    testBlock.push(`    result = sol.${methodName}(${argList})`);
    testBlock.push(`    print("Output:", result)`);
    testBlock.push(`    print("Expected:", ${JSON.stringify(tc.expected)})`);
    testBlock.push(`    print()`);
  });

  return `${importBlock}

${stub}

if __name__ == "__main__":
    sol = Solution()
${testBlock.join('\n')}`;
}

function generateJavaScript(stub, testCases) {
  const testBlock = [];
  testCases.forEach((tc, idx) => {
    const args = parseStdin(tc.stdin);
    const argList = Object.values(args).map(v => JSON.stringify(v)).join(', ');
    const funcName = stub.match(/function\s+(\w+)\s*\(/)?.[1] || stub.match(/var\s+(\w+)\s*=/)?.[1] || 'solution';
    testBlock.push(`console.log("Test case ${idx+1}:");`);
    testBlock.push(`console.log(${funcName}(${argList}));`);
    testBlock.push(`console.log("Expected: ${tc.expected}");`);
    testBlock.push(`console.log();`);
  });
  return `${stub}

${testBlock.join('\n')}`;
}

function generateFullRunner(language, stub, testCases) {
  switch (language) {
    case 'Python3':
    case 'Python':
      return generatePython(stub, testCases);
    case 'JavaScript':
      return generateJavaScript(stub, testCases);
    default:
      return stub;
  }
}

module.exports = { generateFullRunner };