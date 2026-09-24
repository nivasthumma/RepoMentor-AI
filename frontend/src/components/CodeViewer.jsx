import React, { useRef, useState, useMemo } from 'react';

const KEYWORDS = ['import', 'from', 'export', 'class', 'function', 'const', 'let', 'var',
  'return', 'if', 'else', 'for', 'while', 'async', 'await', 'new', 'try', 'catch',
  'throw', 'interface', 'extends', 'implements', 'type', 'default', 'this', 'void',
  'null', 'undefined', 'true', 'false', 'Promise'];

function tokenize(line) {
  const tokens = [];
  const parts = line.split(/(\/\/.*|".*?"|'.*?`|`.*?`|\b[a-zA-Z_$][\w$]*\b|[{}()[\];:,.<>+\-*/=!|&]|\s+)/g);
  for (const part of parts) {
    if (!part) continue;
    if (/^\/\/.*/.test(part)) {
      tokens.push({ text: part, type: 'comment' });
    } else if (/^["'`]/.test(part)) {
      tokens.push({ text: part, type: 'string' });
    } else if (/^\d+(\.\d+)?$/.test(part)) {
      tokens.push({ text: part, type: 'number' });
    } else if (KEYWORDS.includes(part)) {
      tokens.push({ text: part, type: 'keyword' });
    } else if (/^[{}()[\];:,.<>+\-*/=!|&]+$/.test(part)) {
      tokens.push({ text: part, type: 'punctuation' });
    } else if (/^\s+$/.test(part)) {
      tokens.push({ text: part, type: 'whitespace' });
    } else {
      tokens.push({ text: part, type: 'identifier' });
    }
  }
  return tokens;
}

function getFunctionLines(source, funcName, functions) {
  const func = functions.find(f => f.name === funcName);
  if (!func) return [];
  const lines = source.split('\n');
  return lines.slice(func.lines[0] - 1, func.lines[1]);
}

export default function CodeViewer({
  sourceCodeEntry,
  selectedFile,
  selectedFunction,
  onSelectFunction,
  onExplainCode,
  onExplainFunction,
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const codeRef = useRef(null);

  if (!sourceCodeEntry || !selectedFile) return null;

  const { content, functions } = sourceCodeEntry;
  const lines = content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const highlighted = useMemo(() => {
    return lines.map((line, i) => ({
      lineNum: i + 1,
      tokens: tokenize(line),
      raw: line,
      isFunctionLine: functions.some(f =>
        (i + 1) >= f.lines[0] && (i + 1) <= f.lines[1]
      ),
      isSelectedFuncLine: selectedFunction
        ? (() => {
            const func = functions.find(f => f.name === selectedFunction);
            return func && (i + 1) >= func.lines[0] && (i + 1) <= func.lines[1];
          })()
        : false,
    }));
  }, [content, selectedFunction, functions]);

  return (
    <section className="workspace-section code-viewer">
      <div className="code-viewer-header">
        <div className="code-viewer-header-left">
          <h2 className="section-title">View Code</h2>
          <span className="code-viewer-path">{selectedFile.split('/').pop()}</span>
        </div>
        <div className="code-viewer-header-actions">
          <button
            className="code-action-btn"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse code' : 'Expand code'}
          >
            {expanded ? '\u25B2' : '\u25BC'}
          </button>
          <button
            className="code-action-btn"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {copied ? '\u2713' : '\u2398'}
          </button>
          {onExplainCode && (
            <button
              className="code-action-btn code-action-explain"
              onClick={() => onExplainCode(selectedFile)}
            >
              Explain this code
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="code-viewer-body" ref={codeRef}>
          <div className="code-viewer-toolbar">
            <span className="code-viewer-toolbar-path">{selectedFile}</span>
            <span className="code-viewer-toolbar-lines">{lines.length} lines</span>
          </div>
          <div className="code-viewer-scroll">
            <table className="code-table">
              <tbody>
                {highlighted.map((line) => (
                  <tr
                    key={line.lineNum}
                    className={`code-line ${line.isFunctionLine ? 'code-line-function' : ''} ${line.isSelectedFuncLine ? 'code-line-selected-func' : ''}`}
                  >
                    <td className="code-line-num">{line.lineNum}</td>
                    <td className="code-line-content">
                      {line.tokens.map((token, ti) => (
                        <span key={ti} className={`code-token-${token.type}`}>{token.text}</span>
                      ))}
                    </td>
                    <td className="code-line-funcs">
                      {line.isFunctionLine && (
                        <span className="code-line-func-indicator">{'\u25A0'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {functions.length > 0 && (
            <div className="code-function-list">
              <span className="code-function-list-label">Functions / Endpoints</span>
              <div className="code-function-list-items">
                {functions.map((func) => (
                  <button
                    key={func.name}
                    className={`code-function-chip ${selectedFunction === func.name ? 'code-function-chip-active' : ''}`}
                    onClick={() => onSelectFunction(func.name)}
                  >
                    {func.name}
                    {onExplainFunction && (
                      <span
                        className="code-function-explain"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExplainFunction(selectedFile, func.name);
                        }}
                        title="Explain this function"
                      >
                        {'\u24D8'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}