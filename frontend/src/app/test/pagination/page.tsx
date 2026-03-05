"use client";

import { useState } from "react";
import Pagination from "@/shared/components/Pagination";
import Button from "@/shared/components/Button";
import ThemeToggle from "@/shared/components/ThemeToggle";
import CodeBlock from "@/shared/components/CodeBlock";
import Input from "@/shared/components/Input";

export default function PaginationTestPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1000);
  const [siblingCount, setSiblingCount] = useState(2);
  const [showFirstLast, setShowFirstLast] = useState(true);
  const [showPrevNext, setShowPrevNext] = useState(true);
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [lastAction, setLastAction] = useState("");

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLastAction(`Page changed to ${page}`);
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1.5rem",
    marginBottom: "2rem",
  };

  const previewStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100px",
    marginTop: "1rem",
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Pagination – Full Edge Case Test</h1>
        <ThemeToggle variant="both" label="Toggle theme" />
      </div>

      {/* Interactive Controls */}
      <section style={sectionStyle}>
        <h2>Interactive Controls</h2>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          }}
        >
          <Input
            type="number"
            label="Current Page"
            value={currentPage}
            min={-10}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            fullWidth
          />

          <Input
            type="number"
            label="Total Pages"
            value={totalPages}
            min={-10}
            onChange={(e) => setTotalPages(Number(e.target.value))}
            fullWidth
          />

          <Input
            type="number"
            label="Sibling Count"
            value={siblingCount}
            min={-5}
            onChange={(e) => setSiblingCount(Number(e.target.value))}
            fullWidth
          />
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1.5rem" }}>
          <label>
            <input
              type="checkbox"
              checked={showFirstLast}
              onChange={(e) => setShowFirstLast(e.target.checked)}
            />{" "}
            Show First/Last
          </label>

          <label>
            <input
              type="checkbox"
              checked={showPrevNext}
              onChange={(e) => setShowPrevNext(e.target.checked)}
            />{" "}
            Show Prev/Next
          </label>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <Button
            onClick={() => {
              for (let i = 1; i <= 1000; i++) {
                setTimeout(() => setCurrentPage(i), i * 50);
              }
            }}
          >
            Stress Page Change
          </Button>
        </div>

        {lastAction && (
          <p style={{ marginTop: "1rem", opacity: 0.7 }}>
            <strong>Last Action:</strong> {lastAction}
          </p>
        )}
      </section>

      {/* Live Preview */}
      <section style={sectionStyle}>
        <h2>Live Preview</h2>
        <div style={previewStyle}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            siblingCount={siblingCount}
            showFirstLast={showFirstLast}
            showPrevNext={showPrevNext}
            size={size}
          />
        </div>
      </section>

      {/* Edge Cases */}
      <section style={sectionStyle}>
        <h2>Edge Case Tests</h2>

        {/* Invalid currentPage */}
        <div style={previewStyle}>
          <Pagination currentPage={0} totalPages={10} onPageChange={() => {}} />
        </div>

        <div style={previewStyle}>
          <Pagination currentPage={-5} totalPages={10} onPageChange={() => {}} />
        </div>

        <div style={previewStyle}>
          <Pagination currentPage={20} totalPages={10} onPageChange={() => {}} />
        </div>

        {/* Invalid totalPages */}
        <div style={previewStyle}>
          <Pagination currentPage={1} totalPages={0} onPageChange={() => {}} />
        </div>

        <div style={previewStyle}>
          <Pagination currentPage={1} totalPages={-10} onPageChange={() => {}} />
        </div>

        {/* Huge totalPages */}
        <div style={previewStyle}>
          <Pagination
            currentPage={5000}
            totalPages={10000}
            siblingCount={1}
            onPageChange={() => {}}
          />
        </div>

        {/* Extreme siblingCount */}
        <div style={previewStyle}>
          <Pagination
            currentPage={5}
            totalPages={10}
            siblingCount={20}
            onPageChange={() => {}}
          />
        </div>

        <div style={previewStyle}>
          <Pagination
            currentPage={5}
            totalPages={10}
            siblingCount={-2}
            onPageChange={() => {}}
          />
        </div>

        {/* No navigation buttons */}
        <div style={previewStyle}>
          <Pagination
            currentPage={5}
            totalPages={20}
            showFirstLast={false}
            showPrevNext={false}
            onPageChange={() => {}}
          />
        </div>

        {/* Boundary positions */}
        <div style={previewStyle}>
          <Pagination currentPage={1} totalPages={50} onPageChange={() => {}} />
        </div>

        <div style={previewStyle}>
          <Pagination currentPage={50} totalPages={50} onPageChange={() => {}} />
        </div>

        {/* Inside form test */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Form submitted!");
          }}
        >
          <div style={previewStyle}>
            <Pagination currentPage={5} totalPages={20} onPageChange={() => {}} />
          </div>
          <Button type="submit">Submit Form</Button>
        </form>
      </section>

      {/* Current Props Display */}
      <section style={sectionStyle}>
        <h2>Current Props</h2>
        <CodeBlock
          language="tsx"
          code={`<Pagination
  currentPage={${currentPage}}
  totalPages={${totalPages}}
  siblingCount={${siblingCount}}
  showFirstLast={${showFirstLast}}
  showPrevNext={${showPrevNext}}
  size="${size}"
/>`}
          showLineNumbers
        />
      </section>
    </main>
  );
}