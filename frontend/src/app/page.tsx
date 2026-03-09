"use client";

import { useState } from "react";
import CodeBlock from "@/shared/components/CodeBlock";
import Button from "@/shared/components/Button";
import ThemeToggle from "@/shared/components/ThemeToggle";
import {
  FaInfo,
  FaCheck,
  FaExclamationCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "@/shared/components/Toast";
import NoRecordFound from "@/shared/components/NoRecordFound";

export default function HomePage() {
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
    toast.success("Python code saved successfully!");
  };

  const handleSaveJs = (newCode: string) => {
    setJsCode(newCode);
    setLastAction(`✅ JavaScript code saved at ${new Date().toLocaleTimeString()}`);
    toast.success("JavaScript code saved successfully!");
  };

  const handleDeletePython = () => {
    if (confirm("Are you sure you want to delete the Python code?")) {
      setPythonCode("# Code deleted");
      setLastAction(`🗑️ Python code deleted at ${new Date().toLocaleTimeString()}`);
      toast.warning("Python code deleted");
    }
  };

  const handleDeleteJs = () => {
    if (confirm("Are you sure you want to delete the JavaScript code?")) {
      setJsCode("// Code deleted");
      setLastAction(`🗑️ JavaScript code deleted at ${new Date().toLocaleTimeString()}`);
      toast.warning("JavaScript code deleted");
    }
  };

  const handleDeleteHtml = () => {
    if (confirm("Are you sure you want to delete the HTML code?")) {
      setHtmlCode("<!-- Code deleted -->");
      setLastAction(`🗑️ HTML code deleted at ${new Date().toLocaleTimeString()}`);
      toast.warning("HTML code deleted");
    }
  };

  return (
    <main>
      <style>{`
        .custom-code-block {
          border: 2px solid red;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
        }
        .custom-code-block .header {
          background-color: rgba(255, 0, 0, 0.1);
        }
        .theme-demo-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .theme-demo-row {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 1rem;
        }
      `}</style>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolores a at minima temporibus sapiente consequuntur quaerat omnis asperiores odio possimus quia fuga illum totam nisi rem est iure, eos quibusdam.
    </main>
  );
}