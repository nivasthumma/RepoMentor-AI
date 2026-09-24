import React, { useState, useMemo } from 'react';

const INVESTIGATION_QUICK_QUESTIONS = [
  'Why does this file exist?',
  'Walk me through this request.',
  'Why is this dependency needed?',
  'What happens if I remove this function?',
  'Where does this data eventually go?',
  'What should I inspect next?',
];

export default function AIExplanationPanel({
  curatedAnswers,
  contextualAnswers,
  fileExplanations,
  selectedFile,
  selectedFunction,
  aiState,
  onPrompt,
  onFileExplain,
  onTypedQuestion,
  onWhatCouldBreak,
  whatCouldBreak,
  investigationData,
  investigationHistory,
  activeInvestigation,
  onInvestigationQuestion,
  onClearInvestigation,
  onInvestigationAction,
}) {
  const [typedInput, setTypedInput] = useState('');
  const [evidenceExpanded, setEvidenceExpanded] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = typedInput.trim();
    if (!trimmed) return;
    onInvestigationQuestion(trimmed);
    setTypedInput('');
  };

  const isContextualActive = aiState.activePrompt && typeof aiState.activePrompt === 'object';
  const activeAnswer = isContextualActive
    ? aiState.activePrompt
    : aiState.activePrompt
      ? curatedAnswers.find((a) => a.prompt === aiState.activePrompt)
      : null;

  const fileExplanation = aiState.activeFileExplanation
    ? fileExplanations[aiState.activeFileExplanation]
    : null;

  const fileContextualAnswers = selectedFile && contextualAnswers
    ? contextualAnswers[selectedFile] || null
    : null;

  const hasActiveContent = activeAnswer || fileExplanation;

  const currentInvestigation = useMemo(() => {
    if (!activeInvestigation || !investigationData) return null;
    return investigationData[activeInvestigation] || null;
  }, [activeInvestigation, investigationData]);

  const toggleEvidence = (key) => {
    setEvidenceExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAction = (action) => {
    if (onInvestigationAction) onInvestigationAction(action);
  };

  const lastHistory = investigationHistory && investigationHistory.length > 0
    ? investigationHistory[investigationHistory.length - 1]
    : null;

  return (
    <div className="ai-panel">
      <h2 className="section-title">Ask RepoMentor</h2>

      <div className="ai-chips">
        {curatedAnswers.map((a) => (
          <button
            key={a.prompt}
            className={`ai-chip ${!isContextualActive && aiState.activePrompt === a.prompt ? 'ai-chip-active' : ''}`}
            onClick={() => onPrompt(a.prompt)}
          >
            {a.prompt}
          </button>
        ))}
        <button
          className={`ai-chip ${aiState.activeFileExplanation ? 'ai-chip-active' : ''} ${!selectedFile ? 'ai-chip-disabled' : ''}`}
          disabled={!selectedFile}
          onClick={onFileExplain}
          title={!selectedFile ? 'Select an important file to enable Explain this file' : ''}
        >
          Explain this file
        </button>
      </div>

      {fileContextualAnswers && fileContextualAnswers.length > 0 && (
        <div className="ai-contextual">
          <p className="ai-contextual-label">
            Contextual questions for {selectedFile.split('/').pop()}
          </p>
          <div className="ai-contextual-chips">
            {fileContextualAnswers.map((ca) => {
              const isActive = isContextualActive
                ? aiState.activePrompt && aiState.activePrompt.prompt === ca.prompt
                : aiState.activePrompt === ca.prompt;
              return (
                <button
                  key={ca.prompt}
                  className={`ai-chip ai-chip-contextual ${isActive ? 'ai-chip-active' : ''}`}
                  onClick={() => {
                    const fullAnswer = {
                      prompt: ca.prompt,
                      answer: `${ca.answer.summary}\n\n**Code Path**\n${ca.answer.codePath}\n\n**Related Files**\n${ca.answer.relatedFiles.join(', ')}\n\n**Potential Impact**\n${ca.answer.impact}`,
                      references: ca.answer.relatedFiles,
                      isContextual: true,
                    };
                    onPrompt(ca.prompt, fullAnswer);
                  }}
                >
                  {ca.prompt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!hasActiveContent && !lastHistory && aiState.typedError !== 'unsupported' && aiState.typedError !== 'empty' && (
        <div className="ai-guidance-wrap">
          {selectedFile ? (
            <p className="ai-guidance">
              Ask a question about this file or choose a general prompt above.
            </p>
          ) : (
            <>
              <p className="ai-guidance">
                Select an important file and use Explain this file, or choose a prompt above.
              </p>
              <p className="ai-guidance ai-guidance-file">
                Select an important file from the Structure Explorer to enable Explain this file and contextual questions.
              </p>
            </>
          )}
        </div>
      )}

      {selectedFile && !hasActiveContent && !lastHistory && (
        <>
          <button
            className="ai-what-break-btn"
            onClick={() => onWhatCouldBreak && onWhatCouldBreak(selectedFile, selectedFunction)}
            title="Analyse what could break if this code changes"
          >
            {'\u26A0'} What could break?
          </button>
          <p className="ai-guidance ai-guidance-break">
            Use "What could break?" to see a structured impact analysis for this {selectedFunction ? 'function' : 'file'}.
          </p>
        </>
      )}

      {activeAnswer && (
        <div className="ai-answer">
          {activeAnswer.isContextual && (
            <p className="ai-answer-badge">AI-generated explanation based on analyzed repository</p>
          )}
          <p className="ai-answer-prompt"><strong>Question:</strong> {activeAnswer.prompt}</p>
          <div className="ai-answer-text">
            {activeAnswer.answer.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line.startsWith('**') && line.endsWith('**') ? (
                  <strong>{line.replace(/\*\*/g, '')}</strong>
                ) : line.startsWith('**') ? (
                  <strong>{line.replace(/\*\*/g, '')}</strong>
                ) : line.startsWith('  - ') ? (
                  <span className="ai-answer-bullet">{line}</span>
                ) : (
                  line
                )}
                <br />
              </React.Fragment>
            ))}
          </div>
          {activeAnswer.references && activeAnswer.references.length > 0 && (
            <div className="ai-references">
              <h4>References</h4>
              <ul>
                {activeAnswer.references.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {fileExplanation && (
        <div className="ai-answer">
          <p className="ai-answer-badge">AI-generated explanation based on analyzed repository</p>
          <p className="ai-answer-file">
            <strong>{aiState.activeFileExplanation}</strong>
          </p>
          <p className="ai-answer-text">{fileExplanation}</p>
        </div>
      )}

      {aiState.typedError === 'unsupported' && (
        <p className="ai-error" role="alert">
          This prototype can answer the listed questions above or explain a selected
          important file. Please choose one of those options.
        </p>
      )}

      {aiState.typedError === 'empty' && (
        <p className="ai-error" role="alert">
          Please enter a question.
        </p>
      )}

      {investigationHistory && investigationHistory.length > 0 && (
        <div className="ai-investigation-history">
          <div className="ai-investigation-history-header">
            <h3 className="section-title">Investigation</h3>
            <button className="ai-investigation-clear" onClick={onClearInvestigation}>
              Clear
            </button>
          </div>
          <div className="ai-investigation-history-list">
            {investigationHistory.map((h, i) => (
              <div key={i} className="ai-investigation-history-item">
                <span className="ai-investigation-history-q">{h.question.length > 50 ? h.question.slice(0, 50) + '...' : h.question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentInvestigation && (
        <div className="ai-investigation">
          <p className="ai-answer-badge">AI-generated explanation based on the curated PulseBoard repository</p>

          <div className="ai-investigation-answer">
            <p>{currentInvestigation.answer}</p>
          </div>

          <div className="ai-investigation-confidence">
            <span className="ai-inv-confidence-label">Confidence &amp; Scope</span>
            <p className="ai-inv-confidence-text">{currentInvestigation.confidenceScope}</p>
          </div>

          {currentInvestigation.evidence && (
            <div className="ai-investigation-evidence">
              <button
                className="ai-inv-evidence-toggle"
                onClick={() => toggleEvidence('main')}
              >
                {'\u25BC'} Evidence ({currentInvestigation.evidence.files.length + currentInvestigation.evidence.layers.length} items)
              </button>
              {evidenceExpanded['main'] && (
                <div className="ai-inv-evidence-body">
                  {currentInvestigation.evidence.files && currentInvestigation.evidence.files.length > 0 && (
                    <div className="ai-inv-evidence-section">
                      <h4>Files</h4>
                      <div className="ai-inv-evidence-items">
                        {currentInvestigation.evidence.files.map((f, i) => (
                          <button key={i} className="ai-inv-evidence-file" onClick={() => handleAction({ type: 'selectFile', value: f })}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentInvestigation.evidence.functions && currentInvestigation.evidence.functions.length > 0 && (
                    <div className="ai-inv-evidence-section">
                      <h4>Functions</h4>
                      <div className="ai-inv-evidence-items">
                        {currentInvestigation.evidence.functions.map((fn, i) => (
                          <span key={i} className="ai-inv-evidence-func">{fn}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentInvestigation.evidence.layers && currentInvestigation.evidence.layers.length > 0 && (
                    <div className="ai-inv-evidence-section">
                      <h4>Architecture Layers</h4>
                      <div className="ai-inv-evidence-tags">
                        {currentInvestigation.evidence.layers.map((l, i) => (
                          <span key={i} className="ai-inv-evidence-tag">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentInvestigation.evidence.traceSteps && currentInvestigation.evidence.traceSteps.length > 0 && (
                    <div className="ai-inv-evidence-section">
                      <h4>Trace Steps</h4>
                      <div className="ai-inv-evidence-items">
                        {currentInvestigation.evidence.traceSteps.map((ts, i) => (
                          <span key={i} className="ai-inv-evidence-trace">{ts}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentInvestigation.evidence.dependencies && currentInvestigation.evidence.dependencies.length > 0 && (
                    <div className="ai-inv-evidence-section">
                      <h4>Dependencies</h4>
                      <div className="ai-inv-evidence-items">
                        {currentInvestigation.evidence.dependencies.map((d, i) => (
                          <span key={i} className="ai-inv-evidence-dep">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentInvestigation.suggestions && currentInvestigation.suggestions.length > 0 && (
            <div className="ai-investigation-suggestions">
              <h4 className="ai-inv-suggestions-title">Continue investigating</h4>
              <div className="ai-inv-suggestions-list">
                {currentInvestigation.suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="ai-inv-suggestion-btn"
                    onClick={() => handleAction(s.action)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentInvestigation.nextBest && (
            <div className="ai-investigation-next">
              <h4 className="ai-inv-next-title">Next best investigation</h4>
              <button
                className="ai-inv-next-btn"
                onClick={() => onInvestigationQuestion(currentInvestigation.nextBest.question)}
              >
                <span className="ai-inv-next-q">{currentInvestigation.nextBest.question}</span>
                <span className="ai-inv-next-preview">{currentInvestigation.nextBest.preview}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {lastHistory && !currentInvestigation && lastHistory.answer && (
        <div className="ai-investigation">
          <p className="ai-answer-badge">AI-generated explanation based on the curated PulseBoard repository</p>
          <div className="ai-investigation-answer">
            <p>{lastHistory.answer}</p>
          </div>
        </div>
      )}

      {!currentInvestigation && !hasActiveContent && (
        <div className="ai-investigation-invite">
          <p className="ai-inv-invite-label">Investigate the codebase</p>
          <div className="ai-inv-invite-chips">
            {INVESTIGATION_QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                className="ai-inv-invite-chip"
                onClick={() => onInvestigationQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="ai-typed-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="ai-typed-input"
          placeholder="Ask a question to investigate..."
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          aria-label="Ask a question about the repository"
        />
        <button type="submit" className="ai-typed-submit">
          Ask
        </button>
      </form>
    </div>
  );
}