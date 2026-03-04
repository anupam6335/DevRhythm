"use client";

import React, { useState } from 'react';
import MarkdownRenderer from '@/shared/components/MarkdownRenderer';
import TextArea from '@/shared/components/TextArea';
import ThemeToggle from '@/shared/components/ThemeToggle';
import Button from '@/shared/components/Button';
import {
  FaMarkdown,
  FaHeading,
  FaList,
  FaLink,
  FaImage,
  FaCode,
  FaTable,
  FaTasks,
  FaQuoteRight,
  FaMinus,
  FaBolt,
  FaTrash,
  FaSun,
  FaMoon,
  FaExclamationTriangle,
  FaShieldAlt,
  FaTerminal,
  FaUserSecret,
} from 'react-icons/fa';

export default function MarkdownRendererTestPage() {
  const [markdown, setMarkdown] = useState<string>(`# Welcome to the Markdown Renderer

This is a **live preview** of your markdown. Start typing in the left panel and see the result here.

## Features

- **Headings** (H1 to H6)
- **Emphasis**: *italic*, **bold**, ~~strikethrough~~
- **Lists** (ordered & unordered, nested)
- [Links](https://devrhythm.com)
- ![Image Alt](https://via.placeholder.com/150 "Optional title")
- > Blockquotes for personal notes
- \`inline code\` and fenced code blocks:
  \`\`\`javascript
  console.log("Hello, world!");
  \`\`\`
- Tables, task lists, horizontal rules, and more.

Try clicking the example buttons above to load different markdown snippets.
`);

  const [useNotesFont, setUseNotesFont] = useState(false);
  const [disallowImages, setDisallowImages] = useState(false);
  const [unwrapDisallowed, setUnwrapDisallowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [lastCodeAction, setLastCodeAction] = useState('');

  // Example markdown snippets (including edge cases)
  const examples = [
    {
      name: 'Basic',
      icon: <FaMarkdown />,
      content: `# Basic Example

This is a paragraph with **bold** and *italic* text.

- Unordered list item
- Another item

1. Ordered list
2. Second item

[Link to Google](https://google.com)`,
    },
    {
      name: 'Headings',
      icon: <FaHeading />,
      content: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`,
    },
    {
      name: 'Lists (nested)',
      icon: <FaList />,
      content: `## Unordered
- Item 1
  - Nested item
    - Deep nested
- Item 2

## Ordered
1. First
2. Second
   1. Sub-item
   2. Another sub-item
3. Third`,
    },
    {
      name: 'Links & Images',
      icon: <FaLink />,
      content: `## Links
[DevRhythm](https://devrhythm.com)
[Reference link][ref]
<https://auto-link.com>

[ref]: https://example.com "Example Title"

## Images
![Placeholder](https://via.placeholder.com/150)
![Alt](https://via.placeholder.com/200 "Optional title")`,
    },
    {
      name: 'Code Blocks',
      icon: <FaCode />,
      content: `## Inline code
Use the \`console.log()\` function.

## Fenced code blocks
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet('DevRhythm'));
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

\`\`\`css
.container {
  display: flex;
  justify-content: center;
}
\`\`\`

\`\`\`bash
echo "Hello from bash"
\`\`\`

\`\`\`c++
#include <iostream>
int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}
\`\`\``,
    },
    {
      name: 'Tables',
      icon: <FaTable />,
      content: `| Feature | Support | Notes |
|---------|---------|-------|
| Tables  | ✅      | GFM   |
| Alignment | :---: | center |
| Styling | ❌      | soon™ |

| Left | Center | Right |
|:-----|:------:|------:|
| 1    | 2      | 3     |
| 4    | 5      | 6     |`,
    },
    {
      name: 'Task Lists',
      icon: <FaTasks />,
      content: `- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media

## Nested tasks
- [x] Project setup
  - [x] Install dependencies
  - [ ] Configure build
- [ ] Deploy to production`,
    },
    {
      name: 'Blockquotes & HR',
      icon: <FaQuoteRight />,
      content: `> This is a blockquote.
> It can span multiple lines.

> **Nested?**
>> Yes, you can nest blockquotes.

---

And here's a horizontal rule (above).`,
    },
    {
      name: 'All Features',
      icon: <FaBolt />,
      content: `# Full Demo

**Bold**, *italic*, ~~strikethrough~~, \`code\`.

- Lists
  - Nested
    1. Ordered inside unordered

> Blockquote with **bold**

| Table | Header |
|-------|--------|
| Cell1 | Cell2  |

- [x] Task 1
- [ ] Task 2

\`\`\`json
{
  "key": "value",
  "array": [1, 2, 3]
}
\`\`\`

![Small icon](https://via.placeholder.com/50)

[Link](#)`,
    },
    {
      name: 'Empty',
      icon: <FaTrash />,
      content: '',
    },
    {
      name: 'Whitespace',
      icon: <FaMinus />,
      content: '   \n\n   \n   ',
    },
    {
      name: 'Long Text',
      icon: <FaMinus />,
      content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

**Repeated 5 times:**

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    },
    {
      name: 'Emoji & Unicode',
      icon: <FaSun />,
      content: `## Emoji
- 🚀 Rocket
- 💻 Code
- 📝 Notes
- ✅ Checkmark

## Unicode
- Greek: αβγδέ
- Math: ∑∏∫√∞
- Arrows: ←↑→↓↔
- Box drawing: ┌─┐│└─┘

## Mixed
**Bold** with emoji 🎉 and *italic* with ✨.`,
    },
    {
      name: 'Special Characters',
      icon: <FaExclamationTriangle />,
      content: `## HTML Entities
&lt; &gt; &amp; &quot; &#39;

## Raw HTML (if allowed)
<div style="color: red;">This is red text (raw HTML)</div>
<script>alert('XSS')</script>

## Markdown escaping
\\*not italic\\*
\\[not a link\\]

## Angle brackets
<not a tag>
<tag>this is just text</tag>`,
    },
    {
      name: 'Broken Syntax',
      icon: <FaTerminal />,
      content: `# Unclosed tag
<strong>bold

# Missing closing bracket
[link](http://example.com

# Unclosed code fence
\`\`\`javascript
console.log("missing closing)

# Unordered list with wrong indent
- Item
 - Subitem (wrong)
   - Sub-sub (correct)

# Table with missing pipes
| Header1 | Header2
|--------|--------
| cell1 | cell2
| cell3 | cell4`,
    },
  ];

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;
  const lineCount = markdown.split('\n').length;

  // Handle code block actions
  const handleCodeSave = (newCode: string, language: string) => {
    setAdminMessage(`✅ Saved ${language} code: ${newCode.substring(0, 30)}...`);
    setLastCodeAction(`Saved ${language} block`);
  };

  const handleCodeDelete = (language: string) => {
    setAdminMessage(`🗑️ Deleted ${language} code block`);
    setLastCodeAction(`Deleted ${language} block`);
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .test-header h1 {
          font-family: var(--font-heading);
          margin: 0;
          color: var(--text-primary);
        }
        .example-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 1rem 0;
        }
        .split-view {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }
        .panel {
          background-color: var(--bg-surface);
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 12px var(--shadow);
        }
        .panel h2 {
          font-family: var(--font-heading);
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.25rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .stats {
          display: flex;
          gap: 1rem;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        .props-panel {
          background-color: var(--bg-elevated);
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 1rem 0;
          border: 1px solid var(--border);
        }
        .props-panel h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
        }
        .props-panel .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
        }
        .props-panel label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .props-panel input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
        }
        .admin-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: var(--bg-elevated);
          border-left: 4px solid var(--accent-moss);
          border-radius: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .admin-message strong {
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .split-view {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="test-header">
        <h1>📝 Markdown Renderer – Complete Test Suite</h1>
        <ThemeToggle variant="both" />
      </div>

      {/* Example buttons */}
      <div className="example-buttons">
        {examples.map((ex) => (
          <Button
            key={ex.name}
            variant="secondary"
            size="sm"
            leftIcon={ex.icon}
            onClick={() => setMarkdown(ex.content)}
          >
            {ex.name}
          </Button>
        ))}
      </div>

      {/* Props controls */}
      <div className="props-panel">
        <h3>🧪 Component Props</h3>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={useNotesFont}
              onChange={(e) => setUseNotesFont(e.target.checked)}
            />
            <code>useNotesFont = {useNotesFont.toString()}</code>
          </label>
          <label>
            <input
              type="checkbox"
              checked={disallowImages}
              onChange={(e) => setDisallowImages(e.target.checked)}
            />
            <code>disallowedElements = {disallowImages ? "['img']" : 'undefined'}</code>
          </label>
          <label>
            <input
              type="checkbox"
              checked={unwrapDisallowed}
              onChange={(e) => setUnwrapDisallowed(e.target.checked)}
              disabled={!disallowImages}
            />
            <code>unwrapDisallowed = {unwrapDisallowed.toString()}</code>
          </label>
          <label>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            <code>isAdmin = {isAdmin.toString()}</code>
          </label>
        </div>
        {isAdmin && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <FaUserSecret style={{ marginRight: '0.3rem' }} />
            Admin mode enabled – you can edit/delete code blocks.
          </div>
        )}
      </div>

      {/* Admin feedback */}
      {adminMessage && (
        <div className="admin-message">
          <strong>📋 Admin action:</strong> {adminMessage}{' '}
          <small>({lastCodeAction})</small>
        </div>
      )}

      {/* Split view */}
      <div className="split-view">
        {/* Left panel: Input */}
        <div className="panel">
          <h2>
            <FaMarkdown /> Markdown Input
          </h2>
          <TextArea
            label="Write your markdown here"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# Start typing..."
            rows={15}
            autoResize
            showCount
            maxLength={10000}
            helperText="Type markdown – see live preview on the right."
          />
          <div className="stats">
            <span>Words: {wordCount}</span>
            <span>Characters: {charCount}</span>
            <span>Lines: {lineCount}</span>
          </div>
        </div>

        {/* Right panel: Output */}
        <div className="panel">
          <MarkdownRenderer
            content={markdown}
            useNotesFont={useNotesFont}
            disallowedElements={disallowImages ? ['img'] : undefined}
            unwrapDisallowed={unwrapDisallowed}
            isAdmin={isAdmin}
            onCodeSave={handleCodeSave}
            onCodeDelete={handleCodeDelete}
          />
          <div className="stats" style={{ marginTop: '1rem' }}>
            <span>Live preview – theme aware</span>
          </div>
        </div>
      </div>

      {/* Comprehensive test checklist */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '1rem',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9rem' }}>
          Click example buttons, toggle props, and type freely to verify every aspect.
        </p>
      </div>
    </main>
  );
}