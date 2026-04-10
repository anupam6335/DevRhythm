const { executeBatch } = require('../codeExecution.service');
const { generateRunner } = require('./runnerGenerator.service');
const { compareResult } = require('./resultComparator.service');
const testCaseParser = require('../testCaseParser.service');

async function orchestrateExecution({ language, userCode, question, testCases, options = {} }) {
    // Use stored metadata (already extracted in Phase 1)
    const metadata = {
        methodName: question.methodName,
        className: question.className,
        isInteractive: question.isInteractive,
        paramTypes: question.paramTypes || [],
        returnType: question.returnType || 'any'
    };

    // Generate final runner with all metadata
    const finalCode = generateRunner(language, userCode, metadata);

    // Obtain structured test cases (already stored in question.testCasesStructured if available)
    let structuredTestCases = testCases;
    if (!structuredTestCases || structuredTestCases.length === 0) {
        if (question.testCasesStructured && question.testCasesStructured.length > 0) {
            structuredTestCases = question.testCasesStructured;
        } else if (question.testCases && question.testCases.length > 0) {
            // Fallback conversion (should be rare after backfill)
            structuredTestCases = testCaseParser.convertToStructuredTestCases(question.testCases, metadata);
        } else {
            throw new Error('No test cases available for this question');
        }
    }

    // Prepare stdin: each test case is a JSON object with "args"
    const batchInputs = structuredTestCases.map(tc => JSON.stringify({ args: tc.args }));

    const batchResults = await executeBatch({
        language,
        code: finalCode,
        testCases: batchInputs.map(stdin => ({ stdin, expected: '' }))
    });

    const results = batchResults.map((res, idx) => {
        const actualOutput = res.stdout || '';
        const expectedOutput = structuredTestCases[idx].expected;
        const passed = compareResult(actualOutput, expectedOutput, {
            orderInsensitive: question.isOrderIrrelevant || false,
            epsilon: 1e-6
        });
        return {
            input: structuredTestCases[idx].args,
            output: actualOutput,
            expected: JSON.stringify(expectedOutput),
            error: res.stderr,
            exitCode: res.exitCode,
            passed
        };
    });

    const passedCount = results.filter(r => r.passed).length;
    const allPassed = passedCount === results.length;

    return { results, passedCount, totalCount: results.length, allPassed };
}

module.exports = { orchestrateExecution };