import React from 'react';

export default function TraceCodePath({
  traceCodePaths,
  activeTracePath,
  activeTraceStep,
  onStartTracePath,
  onTraceStepChange,
  onCloseTracePath,
}) {
  if (!traceCodePaths || traceCodePaths.length === 0) return null;

  const path = activeTracePath !== null ? traceCodePaths[activeTracePath] : null;

  return (
    <section className="workspace-section trace-path">
      <h2 className="section-title">Trace Code Path</h2>

      {activeTracePath === null && (
        <div className="trace-path-list">
          <p className="trace-path-hint">
            Trace how a request or feature flows through the system.
          </p>
          {traceCodePaths.map((tp, i) => (
            <button
              key={i}
              className="trace-path-btn"
              onClick={() => onStartTracePath(i)}
            >
              <span className="trace-path-btn-name">{tp.name}</span>
              <span className="trace-path-btn-desc">{tp.description}</span>
            </button>
          ))}
        </div>
      )}

      {path && (
        <div className="trace-path-active">
          <div className="trace-path-header">
            <h3 className="trace-path-title">{path.name}</h3>
            <button className="trace-path-close" onClick={onCloseTracePath} aria-label="Close trace path">
              {'\u2715'}
            </button>
          </div>

          <div className="trace-path-step-indicator">
            {path.steps.map((_, i) => (
              <React.Fragment key={i}>
                <button
                  className={`trace-path-dot ${i === activeTraceStep ? 'trace-path-dot-active' : ''} ${i < activeTraceStep ? 'trace-path-dot-done' : ''}`}
                  onClick={() => onTraceStepChange(i)}
                  aria-label={`Go to step ${i + 1}`}
                >
                  {i + 1}
                </button>
                {i < path.steps.length - 1 && (
                  <span className={`trace-path-connector ${i < activeTraceStep ? 'trace-path-connector-done' : ''}`}></span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="trace-path-visual">
            {path.steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className={`trace-path-visual-step ${i === activeTraceStep ? 'trace-path-visual-active' : ''} ${i < activeTraceStep ? 'trace-path-visual-done' : ''}`}>
                  <span className="trace-path-visual-icon">
                    {i < activeTraceStep ? '\u2713' : i === activeTraceStep ? '\u25B6' : '\u25CB'}
                  </span>
                  <div className="trace-path-visual-info">
                    <span className="trace-path-visual-file">{step.file.split('/').pop()}</span>
                    <span className="trace-path-visual-layer">{step.layer}</span>
                  </div>
                </div>
                {i < path.steps.length - 1 && (
                  <div className={`trace-path-visual-arrow ${i < activeTraceStep ? 'trace-path-visual-arrow-done' : ''}`}>
                    <span className="trace-path-visual-arrow-line"></span>
                    <span className="trace-path-visual-arrow-head">{'\u25BC'}</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="trace-path-detail">
            <p className="trace-path-step-label">
              Step {activeTraceStep + 1} of {path.steps.length}
            </p>
            <h4 className="trace-path-step-file">
              {path.steps[activeTraceStep].file}
            </h4>
            <p className="trace-path-step-explanation">
              {path.steps[activeTraceStep].explanation}
            </p>
            <p className="trace-path-step-detail">
              {path.steps[activeTraceStep].detail}
            </p>
          </div>

          <div className="trace-path-nav">
            <button
              className="trace-path-nav-btn"
              disabled={activeTraceStep === 0}
              onClick={() => onTraceStepChange(activeTraceStep - 1)}
            >
              {'\u25C0'} Previous
            </button>
            <button
              className="trace-path-nav-btn"
              disabled={activeTraceStep === path.steps.length - 1}
              onClick={() => onTraceStepChange(activeTraceStep + 1)}
            >
              Next {'\u25B6'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}