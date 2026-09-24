import React from 'react';

export default function ChangeChecklist({ filePath, functionName, changeChecklists }) {
  if (!filePath) return null;

  const items = changeChecklists ? changeChecklists[filePath] : null;
  if (!items) return null;

  const prefix = functionName ? `Modifying \`${functionName}\`` : `Modifying ${filePath.split('/').pop()}`;

  return (
    <section className="workspace-section change-checklist">
      <h2 className="section-title">Change Checklist</h2>
      <div className="change-checklist-content">
        <p className="change-checklist-intro">
          Before committing changes to <strong>{filePath.split('/').pop()}</strong>
          {functionName ? ` (function: ${functionName})` : ''}, verify the following:
        </p>
        <ul className="change-checklist-list">
          {items.map((item, i) => (
            <li key={i} className="change-checklist-item">
              <span className="change-checklist-checkbox">{'\u25A1'}</span>
              <span className="change-checklist-text">{item}</span>
            </li>
          ))}
        </ul>
        <p className="change-checklist-note">
          Generated from the PulseBoard sample repository context. Actual checklists
          should be supplemented with project-specific items and test results.
        </p>
      </div>
    </section>
  );
}