/**
 * Parses an error message to extract the line number where the error occurred.
 * Supports Python, C++, Java, and JavaScript.
 *
 * @param errorMsg - The raw error message string.
 * @param language - The programming language ('python', 'cpp', 'java', 'javascript').
 * @returns The line number (1‑based) if found, otherwise null.
 */
export function parseErrorLineNumber(errorMsg: string, language: string): number | null {
  if (!errorMsg) return null;

  const lang = language.toLowerCase();

  // Python patterns
  if (lang === 'python') {
    // Pattern 1: File "...", line X, in ...
    const fileLineMatch = errorMsg.match(/File ".*", line (\d+)/);
    if (fileLineMatch) return parseInt(fileLineMatch[1], 10);

    // Pattern 2: line X\n (standalone)
    const lineMatch = errorMsg.match(/line (\d+)/);
    if (lineMatch) return parseInt(lineMatch[1], 10);
  }

  // C++ patterns
  if (lang === 'cpp') {
    // Pattern: error: ... at line X
    const atLineMatch = errorMsg.match(/at line (\d+)/);
    if (atLineMatch) return parseInt(atLineMatch[1], 10);

    // Pattern: :line_number:
    const colonLineMatch = errorMsg.match(/:(\d+):/);
    if (colonLineMatch) return parseInt(colonLineMatch[1], 10);
  }

  // Java patterns
  if (lang === 'java') {
    // Pattern: .java:line_number
    const javaFileMatch = errorMsg.match(/\.java:(\d+)/);
    if (javaFileMatch) return parseInt(javaFileMatch[1], 10);

    // Pattern: line X
    const lineMatch = errorMsg.match(/line (\d+)/);
    if (lineMatch) return parseInt(lineMatch[1], 10);
  }

  // JavaScript (Node.js) patterns
  if (lang === 'javascript') {
    // Pattern: at eval (file:line:col)
    const atMatch = errorMsg.match(/at .*?:(\d+):\d+/);
    if (atMatch) return parseInt(atMatch[1], 10);

    // Pattern: :line:col
    const colonMatch = errorMsg.match(/:(\d+):\d+/);
    if (colonMatch) return parseInt(colonMatch[1], 10);
  }

  return null;
}

/**
 * Determines the type of error based on the message content.
 * @returns 'compilation' | 'runtime' | 'test-case'
 */
export function getErrorType(errorMsg: string): 'compilation' | 'runtime' | 'test-case' {
  const lower = errorMsg.toLowerCase();
  if (lower.includes('syntaxerror') || lower.includes('indentationerror') || lower.includes('compilation') || lower.includes('expected') && lower.includes(';')) {
    return 'compilation';
  }
  if (lower.includes('timeout') || lower.includes('memory limit') || lower.includes('segmentation fault')) {
    return 'runtime';
  }
  return 'runtime'; // default
}