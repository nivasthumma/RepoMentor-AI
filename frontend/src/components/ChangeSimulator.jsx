import React from 'react';

function DiffView({ before, after }) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const maxLines = Math.max(beforeLines.length, afterLines.length);

  return (
    <div className="cs-diff">
      <div className="cs-diff-header">
        <span className="cs-diff-badge cs-diff-before">BEFORE</span>
        <span className="cs-diff-badge cs-diff-after">AFTER</span>
      </div>
      <div className="cs-diff-table-wrap">
        <table className="cs-diff-table">
          <tbody>
            {Array.from({ length: maxLines }, (_, i) => {
              const beforeLine = beforeLines[i] || '';
              const afterLine = afterLines[i] || '';
              const removed = i < beforeLines.length && (i >= afterLines.length || beforeLines[i] !== afterLines[i]);
              const added = i < afterLines.length && (i >= beforeLines.length || beforeLines[i] !== afterLines[i]);
              return (
                <tr key={i} className={`cs-diff-row ${removed && !added ? 'cs-diff-removed' : ''} ${added && !removed ? 'cs-diff-added' : ''} ${removed && added ? 'cs-diff-modified' : ''}`}>
                  <td className="cs-diff-ln">{i + 1}</td>
                  <td className="cs-diff-ln">{i + 1}</td>
                  <td className="cs-diff-code">{beforeLine || '\u00A0'}</td>
                  <td className="cs-diff-code">{afterLine || '\u00A0'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ChangeSimulator({
  changePlan,
  taskName,
  onSelectFile,
  onExitSimulation,
}) {
  if (!changePlan) return null;

  return (
    <section className="workspace-section change-simulator">
      <div className="cs-header">
        <div>
          <h2 className="section-title">AI Change Simulator</h2>
          <span className="cs-disclaimer">Simulation based on the curated PulseBoard sample repository. No files are actually modified.</span>
        </div>
        <button className="cs-exit-btn" onClick={onExitSimulation}>
          Exit Simulation
        </button>
      </div>

      <div className="cs-section">
        <h3 className="cs-section-title">Change Request</h3>
        <p className="cs-text">{changePlan.changeRequest}</p>
      </div>

      <div className="cs-section">
        <h3 className="cs-section-title">Why This Change?</h3>
        <div className="cs-why-grid">
          <div className="cs-why-card">
            <h4>Problem</h4>
            <p>{changePlan.whyChange.problem}</p>
          </div>
          <div className="cs-why-card">
            <h4>Proposed Approach</h4>
            <p>{changePlan.whyChange.proposedApproach}</p>
          </div>
          <div className="cs-why-card">
            <h4>Existing Code</h4>
            <p>{changePlan.whyChange.existingCode}</p>
          </div>
          <div className="cs-why-card">
            <h4>Side Effects</h4>
            <p>{changePlan.whyChange.sideEffects}</p>
          </div>
        </div>
      </div>

      <div className="cs-section">
        <h3 className="cs-section-title">Change Flow</h3>
        <div className="cs-flow">
          {changePlan.changeFlow.map((step, i) => (
            <React.Fragment key={i}>
              <div className="cs-flow-step">
                <span className="cs-flow-num">{i + 1}</span>
                <span className="cs-flow-label">{step}</span>
              </div>
              {i < changePlan.changeFlow.length - 1 && <span className="cs-flow-arrow">{'\u2192'}</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="cs-section">
        <h3 className="cs-section-title">Files to Modify</h3>
        <div className="cs-files">
          {changePlan.filesToModify.map((f, i) => (
            <div key={i} className="cs-file-card">
              <div className="cs-file-top">
                <button className="cs-file-path" onClick={() => onSelectFile && onSelectFile(f.file)}>{f.file}</button>
                <span className={`cs-file-impact cs-file-impact-${f.impact}`}>{f.impact}</span>
              </div>
              <p className="cs-file-reason">{f.reason}</p>
              <div className="cs-file-compare">
                <div className="cs-file-col">
                  <span className="cs-file-label cs-file-label-before">Current</span>
                  <p>{f.currentResponsibility}</p>
                </div>
                <div className="cs-file-col">
                  <span className="cs-file-label cs-file-label-after">Proposed</span>
                  <p>{f.proposedResponsibility}</p>
                </div>
              </div>
              <p className="cs-file-change"><strong>Conceptual change: </strong>{f.conceptualChange}</p>
              {f.dependencies.length > 0 && (
                <div className="cs-file-deps">
                  <span className="cs-file-deps-label">Dependencies:</span>
                  {f.dependencies.map((d, di) => (
                    <button key={di} className="cs-file-dep" onClick={() => onSelectFile && onSelectFile(d)}>{d}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {changePlan.diffPreviews && changePlan.diffPreviews.length > 0 && (
        <div className="cs-section">
          <h3 className="cs-section-title">Proposed Code Changes</h3>
          {changePlan.diffPreviews.map((diff, i) => (
            <div key={i} className="cs-diff-wrap">
              <div className="cs-diff-info">
                <button className="cs-diff-file" onClick={() => onSelectFile && onSelectFile(diff.file)}>{diff.file}</button>
                <span className="cs-diff-desc">{diff.description}</span>
              </div>
              <DiffView before={diff.before} after={diff.after} />
            </div>
          ))}
        </div>
      )}

      {changePlan.verificationPlan && (
        <div className="cs-section">
          <h3 className="cs-section-title">Verification After Change</h3>
          <div className="cs-verify-grid">
            <div className="cs-verify-card">
              <h4>User flows to test</h4>
              <ul>{changePlan.verificationPlan.flowsToCheck.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
            <div className="cs-verify-card">
              <h4>Components to inspect</h4>
              <ul>{changePlan.verificationPlan.componentsToInspect.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
            <div className="cs-verify-card">
              <h4>Error cases</h4>
              <ul>{changePlan.verificationPlan.errorCases.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
            <div className="cs-verify-card">
              <h4>Regression areas</h4>
              <ul>{changePlan.verificationPlan.regressionAreas.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}