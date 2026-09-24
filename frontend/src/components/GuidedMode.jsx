import React, { useMemo } from 'react';

export default function GuidedMode({
  activeTaskId,
  activeTaskStep,
  taskAnalyses,
  guidedStep,
  onGuidedStepChange,
  onSelectTaskFile,
  onSelectTaskFunc,
  onSelectTaskLayer,
  onExitGuidedMode,
}) {
  if (activeTaskId === null || guidedStep === null) return null;

  const task = (taskAnalyses || []).find(t => t.id === activeTaskId);
  if (!task || !task.steps || guidedStep > task.steps.length) return null;

  const totalSteps = task.steps.length;
  const isComplete = guidedStep >= totalSteps;

  const step = isComplete ? null : task.steps[guidedStep];

  const handleGo = (direction) => {
    const nextStep = guidedStep + direction;
    if (nextStep < 0 || nextStep >= totalSteps + 1) return;
    onGuidedStepChange(nextStep);
    if (nextStep < totalSteps) {
      onSelectTaskFile(task.steps[nextStep].file);
      if (task.steps[nextStep].func) onSelectTaskFunc(task.steps[nextStep].func);
      if (task.steps[nextStep].layer) onSelectTaskLayer(task.steps[nextStep].layer);
    }
  };

  const handleDotClick = (i) => {
    onGuidedStepChange(i);
    if (i < totalSteps) {
      onSelectTaskFile(task.steps[i].file);
      if (task.steps[i].func) onSelectTaskFunc(task.steps[i].func);
      if (task.steps[i].layer) onSelectTaskLayer(task.steps[i].layer);
    }
  };

  return (
    <>
      <div className="guided-mode-backdrop" />
      <div className="guided-mode-overlay">
        <div className="guided-mode-panel">
          <div className="guided-mode-header">
            <h2 className="guided-mode-title">{'\u25B6'} Guided Mode: {task.taskQuery}</h2>
            <button className="guided-mode-close" onClick={onExitGuidedMode} aria-label="Exit guided mode">
              {'\u2715'}
            </button>
          </div>

          <div className="guided-mode-progress">
            <span className="guided-mode-step-label">
              {isComplete ? 'Complete' : `Step ${guidedStep + 1} of ${totalSteps}`}
            </span>
            <div className="guided-mode-progress-bar">
              <div
                className="guided-mode-progress-fill"
                style={{ width: `${((isComplete ? totalSteps : guidedStep + 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="guided-mode-dots">
              {task.steps.map((_, i) => (
                <span
                  key={i}
                  className={`guided-mode-dot ${i === guidedStep ? 'guided-mode-dot-active' : ''} ${i < guidedStep ? 'guided-mode-dot-done' : ''}`}
                  onClick={() => handleDotClick(i)}
                />
              ))}
            </div>
          </div>

          {!isComplete && step && (
            <div className="guided-mode-content">
              <div className="guided-mode-why">
                <h3>Why you are here</h3>
                <p>{step.explanation}</p>
              </div>

              <div className="guided-mode-context">
                <div className="guided-mode-context-row">
                  <span className="guided-mode-context-label">File</span>
                  <span className="guided-mode-context-value">{step.file}</span>
                </div>
                {step.func && (
                  <div className="guided-mode-context-row">
                    <span className="guided-mode-context-label">Function</span>
                    <span className="guided-mode-context-value">{step.func}</span>
                  </div>
                )}
                <div className="guided-mode-context-row">
                  <span className="guided-mode-context-label">Layer</span>
                  <span className="guided-mode-context-value">{step.layer}</span>
                </div>
              </div>

              <div className="guided-mode-next">
                <h3>Next expected action</h3>
                <p>Review the code, dependencies, and impact sections in the workspace below. The file and {step.func ? 'function' : 'architecture layer'} have already been selected for you.</p>
              </div>

              <div className="guided-mode-actions">
                <button
                  className="guided-mode-nav-btn"
                  disabled={guidedStep === 0}
                  onClick={() => handleGo(-1)}
                >
                  {'\u25C0'} Previous
                </button>
                {guidedStep < totalSteps - 1 ? (
                  <button
                    className="guided-mode-nav-btn guided-mode-nav-primary"
                    onClick={() => handleGo(1)}
                  >
                    Next {'\u25B6'}
                  </button>
                ) : (
                  <button
                    className="guided-mode-nav-btn guided-mode-nav-primary"
                    onClick={() => handleGo(1)}
                  >
                    Complete {'\u2713'}
                  </button>
                )}
              </div>

              <div className="guided-mode-nav-done">
                <button className="guided-mode-done-btn" onClick={onExitGuidedMode}>
                  Exit Guided Mode
                </button>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="guided-mode-complete">
              <div className="guided-mode-complete-icon">{'\u2713'}</div>
              <h3>Understanding Complete</h3>
              <p className="guided-mode-complete-desc">
                You explored the <strong>{task.taskQuery.toLowerCase()}</strong> task across the PulseBoard repository.
              </p>

              <div className="guided-mode-complete-stats">
                <div className="guided-mode-complete-stat">
                  <span className="guided-mode-complete-stat-value">{totalSteps}</span>
                  <span className="guided-mode-complete-stat-label">Files explored</span>
                </div>
                <div className="guided-mode-complete-stat">
                  <span className="guided-mode-complete-stat-value">
                    {task.steps.filter(s => s.func).length}
                  </span>
                  <span className="guided-mode-complete-stat-label">Functions reviewed</span>
                </div>
                <div className="guided-mode-complete-stat">
                  <span className="guided-mode-complete-stat-value">
                    {new Set(task.steps.map(s => s.layer)).size}
                  </span>
                  <span className="guided-mode-complete-stat-label">Architecture areas</span>
                </div>
              </div>

              <div className="guided-mode-complete-files">
                <h4>Main files understood</h4>
                <div className="guided-mode-complete-file-list">
                  {task.steps.map((s, i) => (
                    <button
                      key={i}
                      className="guided-mode-complete-file"
                      onClick={() => {
                        onSelectTaskFile(s.file);
                        if (s.func) onSelectTaskFunc(s.func);
                      }}
                    >
                      {s.file.split('/').pop()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="guided-mode-complete-actions">
                <p className="guided-mode-complete-suggest">Suggested next action:</p>
                <button
                  className="guided-mode-complete-action-btn"
                  onClick={() => {
                    onExitGuidedMode();
                  }}
                >
                  Review Impact
                </button>
                <button
                  className="guided-mode-complete-action-btn"
                  onClick={() => {
                    onExitGuidedMode();
                  }}
                >
                  Review Change Checklist
                </button>
                <button
                  className="guided-mode-complete-action-btn guided-mode-complete-action-secondary"
                  onClick={onExitGuidedMode}
                >
                  Explore Another Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}