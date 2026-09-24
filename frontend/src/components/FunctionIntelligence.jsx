import React from 'react';

export default function FunctionIntelligence({
  functionData,
  selectedFile,
  sourceCodeEntry,
  onExplainFunction,
  onTraceFromHere,
}) {
  if (!functionData || !sourceCodeEntry) return null;

  const functions = sourceCodeEntry.functions || [];
  const func = functions.find(f => f.name === functionData);
  if (!func) return null;

  const funcLines = sourceCodeEntry.content.split('\n').slice(func.lines[0] - 1, func.lines[1]);

  return (
    <section className="workspace-section function-intel">
      <h2 className="section-title">Function Intelligence</h2>
      <div className="function-intel-content">
        <div className="function-intel-header">
          <h3 className="function-intel-name">{func.name}</h3>
          <span className="function-intel-lines">
            Lines {func.lines[0]}-{func.lines[1]}
          </span>
        </div>

        {funcLines.length > 0 && (
          <div className="function-intel-preview">
            <code className="function-intel-code">
              {funcLines.map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < funcLines.length - 1 ? '\n' : ''}
                </React.Fragment>
              ))}
            </code>
          </div>
        )}

        <div className="function-intel-grid">
          <div className="function-intel-card">
            <h4>What it does</h4>
            <p>{func.description}</p>
          </div>

          <div className="function-intel-card">
            <h4>Inputs / Parameters</h4>
            <p>{func.params}</p>
          </div>

          <div className="function-intel-card">
            <h4>Output / Return value</h4>
            <p>{func.returns}</p>
          </div>

          <div className="function-intel-card">
            <h4>Functions it calls</h4>
            {func.calls && func.calls.length > 0 ? (
              <ul className="function-intel-list">
                {func.calls.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : (
              <p className="function-intel-none">None</p>
            )}
          </div>

          <div className="function-intel-card">
            <h4>Called by</h4>
            {func.calledBy && func.calledBy.length > 0 ? (
              <ul className="function-intel-list">
                {func.calledBy.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : (
              <p className="function-intel-none">None</p>
            )}
          </div>

          <div className="function-intel-card">
            <h4>Side effects</h4>
            <p>{func.sideEffects}</p>
          </div>

          <div className="function-intel-card function-intel-card-failures">
            <h4>Potential failure points</h4>
            <p>{func.failures}</p>
          </div>

          <div className="function-intel-card function-intel-card-beginner">
            <h4>Beginner explanation</h4>
            <p>{func.beginnerExplanation}</p>
          </div>
        </div>

        {(func.tracePathIndex !== null || onExplainFunction) && (
          <div className="function-intel-actions">
            {func.tracePathIndex !== null && onTraceFromHere && (
              <button
                className="function-intel-action-btn"
                onClick={() => onTraceFromHere(func.tracePathIndex, func.traceStepIndex)}
              >
                Trace from here {'\u2192'}
              </button>
            )}
            {onExplainFunction && (
              <button
                className="function-intel-action-btn function-intel-action-explain"
                onClick={() => onExplainFunction(selectedFile, func.name)}
              >
                Explain this function
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}