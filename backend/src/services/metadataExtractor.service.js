// ==================== Metadata Extractor Service ====================
// Extracts method signatures, parameter types, and class information
// from starter code for multiple languages.

/**
 * Extract metadata from starter code for a given language.
 * @param {string} language - 'python', 'javascript', 'cpp', 'java'
 * @param {string} starterCode - The starter code snippet
 * @returns {Object|null} { methodName, className, paramTypes, returnType, isInteractive }
 */
function extractMetadata(language, starterCode) {
    if (!starterCode || typeof starterCode !== 'string') {
        return null;
    }
    switch (language) {
        case 'python':
            return extractFromPython(starterCode);
        case 'javascript':
            return extractFromJavaScript(starterCode);
        case 'cpp':
            return extractFromCpp(starterCode);
        case 'java':
            return extractFromJava(starterCode);
        default:
            return null;
    }
}

// ==================== Python Extractor (Improved) ====================
function extractFromPython(code) {
    try {
        // First, find the Solution class
        const solutionClassMatch = code.match(/class\s+Solution\s*:/);
        if (!solutionClassMatch) {
            return extractFromAnyClassSkippingDataStructures(code);
        }

        // Extract the class body
        const classStart = solutionClassMatch.index;
        let i = classStart + solutionClassMatch[0].length;
        while (i < code.length && code[i] !== '\n') i++;
        i++; // move past newline
        const classBodyStart = i;
        let classBodyEnd = code.length;
        const nextClassMatch = code.substring(classBodyStart).match(/\nclass\s+\w+\s*:/);
        if (nextClassMatch) {
            classBodyEnd = classBodyStart + nextClassMatch.index;
        }
        const classBody = code.substring(classBodyStart, classBodyEnd);

        // Updated regex: handles optional quotes around type hints, and allows any characters inside the return type
        const methodRegex = /^\s+def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*['"]?([\w\[\],\s'"]+)['"]?)?\s*:/gm;
        const methods = [];
        let match;
        while ((match = methodRegex.exec(classBody)) !== null) {
            const methodName = match[1];
            if (methodName.startsWith('__') && methodName.endsWith('__')) continue;
            let paramsStr = match[2].trim();
            const returnHint = (match[3] || 'any').trim();

            // Parse parameters
            const paramTypes = [];
            if (paramsStr) {
                let depth = 0;
                let current = '';
                for (let j = 0; j < paramsStr.length; j++) {
                    const ch = paramsStr[j];
                    if (ch === '[' || ch === '{' || ch === '(') depth++;
                    else if (ch === ']' || ch === '}' || ch === ')') depth--;
                    else if (ch === ',' && depth === 0) {
                        const paramPart = current.trim();
                        let typeHint = 'any';
                        const colonIndex = paramPart.indexOf(':');
                        if (colonIndex !== -1) {
                            typeHint = paramPart.substring(colonIndex + 1).trim();
                        }
                        paramTypes.push(extractTypeHint(typeHint));
                        current = '';
                        continue;
                    }
                    current += ch;
                }
                if (current.trim()) {
                    const paramPart = current.trim();
                    let typeHint = 'any';
                    const colonIndex = paramPart.indexOf(':');
                    if (colonIndex !== -1) {
                        typeHint = paramPart.substring(colonIndex + 1).trim();
                    }
                    paramTypes.push(extractTypeHint(typeHint));
                }
            }

            // Remove the first parameter (self)
            const filteredParamTypes = paramTypes.slice(1);

            methods.push({
                name: methodName,
                paramTypes: filteredParamTypes,
                returnType: extractTypeHint(returnHint)
            });
        }

        if (methods.length === 0) return null;
        const isInteractive = methods.length > 1;
        const mainMethod = methods[0];

        return {
            methodName: mainMethod.name,
            className: 'Solution',
            paramTypes: mainMethod.paramTypes,
            returnType: mainMethod.returnType,
            isInteractive
        };
    } catch (err) {
        console.error(`Python metadata extraction error: ${err.message}`);
        return null;
    }
}

// Helper: skip known data structure classes when Solution is not found
function extractFromAnyClassSkippingDataStructures(code) {
    const classRegex = /class\s+(\w+)\s*:/g;
    let match;
    const dataStructs = new Set(['ListNode', 'TreeNode', 'Node', 'NestedInteger', 'TrieNode', 'Interval', 'Point', 'Employee']);
    let bestMatch = null;
    while ((match = classRegex.exec(code)) !== null) {
        const className = match[1];
        if (dataStructs.has(className)) continue;
        // Try to extract from this class
        const result = extractFromClassBody(code, match.index, className);
        if (result && result.methods.length > 0) {
            bestMatch = result;
            break;
        }
    }
    if (!bestMatch) return null;
    const mainMethod = bestMatch.methods[0];
    return {
        methodName: mainMethod.name,
        className: bestMatch.className,
        paramTypes: mainMethod.paramTypes,
        returnType: mainMethod.returnType,
        isInteractive: bestMatch.methods.length > 1
    };
}

function extractFromClassBody(code, classStartIdx, className) {
    let i = classStartIdx;
    while (i < code.length && code[i] !== ':') i++;
    i++; // skip ':'
    while (i < code.length && code[i] !== '\n') i++;
    i++; // skip newline
    const bodyStart = i;
    const nextClassMatch = code.substring(bodyStart).match(/\nclass\s+\w+\s*:/);
    const bodyEnd = nextClassMatch ? bodyStart + nextClassMatch.index : code.length;
    const classBody = code.substring(bodyStart, bodyEnd);
    const methodRegex = /^\s+def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*['"]?([\w\[\],\s'"]+)['"]?)?\s*:/gm;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
        const methodName = match[1];
        if (methodName.startsWith('__') && methodName.endsWith('__')) continue;
        let paramsStr = match[2].trim();
        const returnHint = (match[3] || 'any').trim();
        const paramTypes = [];
        if (paramsStr) {
            const parts = paramsStr.split(',').map(p => p.trim());
            for (const part of parts) {
                let typeHint = 'any';
                if (part.includes(':')) {
                    typeHint = part.split(':')[1].trim();
                }
                paramTypes.push(extractTypeHint(typeHint));
            }
        }
        const filtered = paramTypes.filter(p => p !== 'self');
        methods.push({
            name: methodName,
            paramTypes: filtered,
            returnType: extractTypeHint(returnHint)
        });
    }
    return { className, methods };
}

// Helper to clean type hints (remove quotes, normalize, handle Optional/List with square brackets)
function extractTypeHint(hint) {
    hint = hint.trim().replace(/^['"]|['"]$/g, ''); // remove surrounding quotes
    // Remove default values (anything after '=')
    const eqIndex = hint.indexOf('=');
    if (eqIndex !== -1) hint = hint.substring(0, eqIndex).trim();
    // Normalize common types
    if (hint === 'None') return 'null';
    if (hint === 'ListNode') return 'ListNode';
    if (hint === 'TreeNode') return 'TreeNode';
    if (hint === 'Node') return 'Node';
    if (hint === 'NestedInteger') return 'NestedInteger';
    if (hint.startsWith('Optional[')) {
        const inner = hint.slice(9, -1);
        return `Optional[${extractTypeHint(inner)}]`;
    }
    if (hint.startsWith('List[')) {
        const inner = hint.slice(5, -1);
        return `List[${extractTypeHint(inner)}]`;
    }
    return hint || 'any';
}

// ==================== JavaScript Extractor ====================
function extractFromJavaScript(code) {
    const classMatch = code.match(/class\s+(\w+)\s*\{/);
    const className = classMatch ? classMatch[1] : 'Solution';
    const methodRegex = /\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(code)) !== null) {
        methods.push({ name: match[1], params: match[2] });
    }
    if (methods.length === 0) return null;
    const isInteractive = methods.length > 1;
    const mainMethod = methods[0];
    const paramTypes = mainMethod.params.split(',').map(p => p.trim()).filter(p => p);
    return {
        methodName: mainMethod.name,
        className,
        paramTypes: paramTypes.map(() => 'any'),
        returnType: 'any',
        isInteractive
    };
}

// ==================== C++ Extractor ====================
function extractFromCpp(code) {
    const classMatch = code.match(/class\s+(\w+)\s*\{/);
    const className = classMatch ? classMatch[1] : 'Solution';
    const methodRegex = /^\s*public:\s*\n\s*(\w+(?:\s*\**\s*)?)\s+(\w+)\s*\(([^)]*)\)\s*\{/gm;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(code)) !== null) {
        methods.push({
            returnType: match[1].trim(),
            name: match[2],
            params: match[3]
        });
    }
    if (methods.length === 0) return null;
    const isInteractive = methods.length > 1;
    const mainMethod = methods[0];
    const paramTypes = mainMethod.params.split(',').map(p => p.trim()).filter(p => p);
    return {
        methodName: mainMethod.name,
        className,
        paramTypes: paramTypes.length ? paramTypes : ['any'],
        returnType: mainMethod.returnType || 'any',
        isInteractive
    };
}

// ==================== Java Extractor ====================
function extractFromJava(code) {
    const classMatch = code.match(/public\s+class\s+(\w+)\s*\{/);
    const className = classMatch ? classMatch[1] : 'Solution';
    const methodRegex = /public\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(code)) !== null) {
        methods.push({
            returnType: match[1],
            name: match[2],
            params: match[3]
        });
    }
    if (methods.length === 0) return null;
    const isInteractive = methods.length > 1;
    const mainMethod = methods[0];
    const paramTypes = mainMethod.params.split(',').map(p => p.trim()).filter(p => p);
    return {
        methodName: mainMethod.name,
        className,
        paramTypes: paramTypes.length ? paramTypes : ['any'],
        returnType: mainMethod.returnType || 'any',
        isInteractive
    };
}

// ==================== Helper: Detect order‑irrelevant problems ====================
function detectOrderIrrelevant(contentRef) {
    if (!contentRef) return false;
    const lower = contentRef.toLowerCase();
    return lower.includes('any order') || lower.includes('order does not matter') || lower.includes('regardless of order');
}

module.exports = {
    extractMetadata,
    detectOrderIrrelevant
};