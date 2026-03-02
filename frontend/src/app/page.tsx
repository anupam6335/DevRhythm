"use client";

import { useState } from "react";
import CodeBlock from "@/shared/components/CodeBlock";
import Button from "@/shared/components/Button";
import {
  FaLightbulb,
  FaInfo,
  FaCheck,
  FaExclamationCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "@/shared/components/Toast"; // ✅ import toast

export default function HomePage() {
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
    toast.info(`Switched to ${newTheme} mode`); // ✅ toast on theme switch
  };

  const [isAdmin, setIsAdmin] = useState(false);

  const [pythonCode, setPythonCode] = useState(`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 Fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`);

  const [jsCode, setJsCode] = useState(`function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}

const unsorted = [3, 6, 8, 10, 1, 2, 1];
console.log(quickSort(unsorted));`);

  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html>
<head>
    <title>Sample</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a test.</p>
</body>
</html>`);

  const [lastAction, setLastAction] = useState<string>("");

  const handleSavePython = (newCode: string) => {
    setPythonCode(newCode);
    setLastAction(`✅ Python code saved at ${new Date().toLocaleTimeString()}`);
    toast.success("Python code saved successfully!"); // ✅ toast
    console.log("Python code saved:", newCode);
  };

  const handleSaveJs = (newCode: string) => {
    setJsCode(newCode);
    setLastAction(`✅ JavaScript code saved at ${new Date().toLocaleTimeString()}`);
    toast.success("JavaScript code saved successfully!"); // ✅ toast
    console.log("JavaScript code saved:", newCode);
  };

  const handleDeletePython = () => {
    if (confirm("Are you sure you want to delete the Python code?")) {
      setPythonCode("# Code deleted");
      setLastAction(`🗑️ Python code deleted at ${new Date().toLocaleTimeString()}`);
      toast.warning("Python code deleted"); // ✅ toast
    }
  };

  const handleDeleteJs = () => {
    if (confirm("Are you sure you want to delete the JavaScript code?")) {
      setJsCode("// Code deleted");
      setLastAction(`🗑️ JavaScript code deleted at ${new Date().toLocaleTimeString()}`);
      toast.warning("JavaScript code deleted"); // ✅ toast
    }
  };

  const handleDeleteHtml = () => {
    if (confirm("Are you sure you want to delete the HTML code?")) {
      setHtmlCode("<!-- Code deleted -->");
      setLastAction(`🗑️ HTML code deleted at ${new Date().toLocaleTimeString()}`);
      toast.warning("HTML code deleted"); // ✅ toast
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <style>{`
        .custom-code-block {
          border: 2px solid red;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
        }
        .custom-code-block .header {
          background-color: rgba(255, 0, 0, 0.1);
        }
      `}</style>

      <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <h1>CodeBlock Demo</h1>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
           <FaLightbulb/> {theme === "light" ? "Dark" : "Light"} Mode
        </Button>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <span>Admin Mode (show edit/delete)</span>
        </label>
      </div>

      {/* Toast Demo Section */}
      <section style={{ marginBottom: "3rem", padding: "1.5rem", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Toast Notifications</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Button variant="primary" onClick={() => toast.success("Operation completed successfully!")}>
            <FaCheck /> Success
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Something went wrong!")}>
            <FaExclamationCircle /> Error
          </Button>
          <Button variant="outline" onClick={() => toast.info("Here's some information for you.")}>
            <FaInfo /> Info
          </Button>
          <Button variant="outline" onClick={() => toast.warning("This action cannot be undone.")}>
            <FaExclamationTriangle /> Warning
          </Button>
        </div>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          Click any button to see a themed toast notification at the top‑center of the screen.
        </p>
      </section>

      {lastAction && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
          }}
        >
          <strong>Last action:</strong> {lastAction}
        </div>
      )}

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Read‑only with custom className</h2>
        <CodeBlock
          code={`console.log("This block has a custom red border!");`}
          language="javascript"
          className="custom-code-block"
        />
        <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>
          The <code>className</code> prop adds a red border and rounded corners.
        </p>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Read‑only (non‑admin)</h2>
        <CodeBlock
          code={`console.log("Hello, world!");`}
          language="javascript"
          showLineNumbers={false}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Read‑only with line numbers</h2>
        <CodeBlock
          code={`# Python with line numbers
def greet(name):
    return f"Hello, {name}!"

print(greet("DevRhythm"))`}
          language="python"
          showLineNumbers={true}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Editable Python (admin only)</h2>
        <CodeBlock
          code={pythonCode}
          language="python"
          isAdmin={isAdmin}
          onSave={handleSavePython}
          onDelete={handleDeletePython}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Editable JavaScript (admin only)</h2>
        <CodeBlock
          code={jsCode}
          language="javascript"
          isAdmin={isAdmin}
          onSave={handleSaveJs}
          onDelete={handleDeleteJs}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Editable HTML (admin only, with line numbers)</h2>
        <CodeBlock
          code={htmlCode}
          language="html"
          showLineNumbers={true}
          isAdmin={isAdmin}
          onSave={(newCode) => {
            setHtmlCode(newCode);
            setLastAction(`✅ HTML code saved at ${new Date().toLocaleTimeString()}`);
            toast.success("HTML code saved successfully!");
          }}
          onDelete={handleDeleteHtml}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>CSS example (read‑only)</h2>
        <CodeBlock
          code={`.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-app);
}`}
          language="css"
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>JSON example (read‑only, line numbers)</h2>
        <CodeBlock
          code={`{
  "name": "DevRhythm",
  "version": "1.0.0",
  "features": ["progress", "revisions", "goals"],
  "users": 1234
}`}
          language="json"
          showLineNumbers={true}
        />
      </section>
    </main>
  );
}