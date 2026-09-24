import React, { useState, useMemo } from 'react';

const TASK_SUGGESTIONS = [
  'Add validation to a form',
  'Change the authentication flow',
  'Add a new API field',
  'Improve error handling',
  'Add a new data source',
];

export default function TaskNavigator({
  taskAnalyses,
  onSelectTaskFile,
  onSelectTaskFunc,
  onSelectTaskLayer,
  onSelectTask,
  onStartGuidedMode,
  onSimulateChange,
  activeTaskId,
  guidedMode,
}) {
  const [taskInput, setTaskInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    return (taskAnalyses || []).find(t => t.id === activeTaskId);
  }, [activeTaskId, taskAnalyses]);

  const handleSubmit = (query) => {
    const q = query || taskInput;
    const match = (taskAnalyses || []).find(t =>
      t.taskQuery.toLowerCase().includes(q.toLowerCase()) ||
      q.toLowerCase().includes(t.taskQuery.toLowerCase().split(' ')[0])
    );
    if (match) {
      onSelectTask && onSelectTask(match.id);
      onSelectTaskFile(match.startHere.file);
      setSubmitted(true);
      setShowSuggestions(true);
    }
    setTaskInput('');
  };

  const handleSuggestion = (query) => {
    setTaskInput(query);
    const match = taskAnalyses.find(t => t.taskQuery === query);
    if (match) {
      onSelectTask && onSelectTask(match.id);
      onSelectTaskFile(match.startHere.file);
      setSubmitted(true);
      setShowSuggestions(true);
    }
  };

  return (
    <section className="workspace-section task-navigator">
      <h2 className="section-title">
        {'\u25B6'} AI Task Navigator
      </h2>

      <div className="task-nav-input-area">
        <p className="task-nav-hint">
          What are you working on?
        </p>
        <div className="task-nav-input-row">
          <input
            type="text"
            className="task-nav-input"
            placeholder="e.g. Add validation to a form"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            aria-label="Describe your development task"
          />
          <button className="task-nav-submit" onClick={() => handleSubmit()}>
            Analyse
          </button>
        </div>

        {!submitted && (
          <div className="task-nav-suggestions">
            <p className="task-nav-suggestions-label">Try suggesting:</p>
            <div className="task-nav-suggestion-chips">
              {TASK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="task-nav-suggestion"
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeTask && submitted && (
        <div className="task-nav-analysis">
          <div className="task-nav-badge">AI-generated repository guidance</div>

          <div className="task-nav-section task-nav-summary">
            <h3 className="task-nav-section-title">Task Summary</h3>
            <p className="task-nav-text">{activeTask.summary}</p>
          </div>

          <div className="task-nav-journey">
            <div className="task-nav-start">
              <span className="task-nav-start-marker">{'\u2217'}</span>
              <div className="task-nav-start-body">
                <h3 className="task-nav-section-title">Start Here</h3>
                <button
                  className="task-nav-file-btn"
                  onClick={() => onSelectTaskFile(activeTask.startHere.file)}
                >
                  <span className="task-nav-file-path">{activeTask.startHere.file}</span>
                  <span className="task-nav-file-reason">{activeTask.startHere.reason}</span>
                </button>
              </div>
            </div>

            <div className="task-nav-journey-rail">
              {activeTask.steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="task-nav-journey-step">
                    <button
                      className="task-nav-journey-btn"
                      onClick={() => {
                        onSelectTaskFile(step.file);
                        if (step.func && onSelectTaskFunc) onSelectTaskFunc(step.func);
                        if (step.layer && onSelectTaskLayer) onSelectTaskLayer(step.layer);
                      }}
                    >
                      <span className="task-nav-journey-marker">{i + 1}</span>
                      <div className="task-nav-journey-info">
                        <span className="task-nav-journey-file">{step.file.split('/').pop()}</span>
                        {step.func && <span className="task-nav-journey-func">{step.func}</span>}
                        <span className="task-nav-journey-layer">{step.layer}</span>
                      </div>
                      <span className="task-nav-journey-arrow">{'\u203A'}</span>
                    </button>
                    <p className="task-nav-journey-explain">{step.explanation}</p>
                  </div>
                  {i < activeTask.steps.length - 1 && (
                    <div className="task-nav-journey-connector" aria-hidden="true"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="task-nav-section">
            <h3 className="task-nav-section-title">Dependency Impact</h3>
            <p className="task-nav-text">{activeTask.dependencyImpact.description}</p>
            <div className="task-nav-impact-tags">
              {activeTask.dependencyImpact.affectedLayers.map(l => (
                <span key={l} className="task-nav-impact-tag">{l}</span>
              ))}
            </div>
          </div>

          <div className="task-nav-section">
            <h3 className="task-nav-section-title">Change Checklist</h3>
            <ul className="task-nav-checklist">
              {activeTask.changeChecklist.map((item, i) => (
                <li key={i} className="task-nav-checklist-item">
                  <span className="task-nav-checkbox">{'\u25A1'}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="task-nav-section">
            <h3 className="task-nav-section-title">Verification Plan</h3>
            <div className="task-nav-verify">
              <p className="task-nav-verify-label">User flows to check:</p>
              <ul className="task-nav-verify-list">
                {activeTask.verificationPlan.flowsToCheck.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="task-nav-verify">
              <p className="task-nav-verify-label">Areas to review:</p>
              <ul className="task-nav-verify-list">
                {activeTask.verificationPlan.areasToReview.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="task-nav-verify">
              <p className="task-nav-verify-label">Related behaviour:</p>
              <ul className="task-nav-verify-list">
                {activeTask.verificationPlan.relatedBehavior.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            className="task-nav-guide-btn"
            onClick={() => onStartGuidedMode(activeTaskId)}
          >
            {'\u25B6'} Guide Me Through This Task
          </button>
          <button
            className="task-nav-simulate-btn"
            onClick={() => onSimulateChange && onSimulateChange(activeTaskId)}
          >
            {'\u25B7'} Simulate Change
          </button>
        </div>
      )}
    </section>
  );
}
