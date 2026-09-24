import React from 'react';

export default function DependencyOverview({
  filePath,
  dependencyRelationships,
  importantFiles,
  architecture,
  traceCodePaths,
  impactScopes,
  onSelectFile,
}) {
  if (!filePath) return null;

  const fileInfo = importantFiles.find(f => f.path === filePath);
  const fileImpact = impactScopes ? impactScopes[filePath] : null;
  const fileLayer = architecture.layers.find(l => l.associatedFiles.includes(filePath));

  const dependsOn = dependencyRelationships
    ? dependencyRelationships.filter(r => r.from === filePath && (r.type === 'imports' || r.type === 'depends-on'))
    : [];

  const usedBy = dependencyRelationships
    ? dependencyRelationships.filter(r => r.to === filePath && (r.type === 'imports' || r.type === 'depends-on' || r.type === 'indirect'))
    : [];

  const relatedDeps = dependencyRelationships
    ? dependencyRelationships.filter(r => r.from === filePath || r.to === filePath)
    : [];

  const relatedTracePaths = traceCodePaths
    ? traceCodePaths.filter(tp => tp.steps.some(s => s.file === filePath))
    : [];

  return (
    <section className="workspace-section dependency-overview">
      <h2 className="section-title">Dependency Overview</h2>
      <div className="dep-overview-content">

        <div className="dep-overview-grid">
          <div className="dep-overview-card">
            <h3><span className="dep-arrow-in">{'\u2190'}</span> Depends on</h3>
            {dependsOn.length > 0 ? (
              <ul className="dep-overview-list">
                {dependsOn.map((r, i) => {
                  const isClickable = importantFiles.some(f => f.path === r.to);
                  return (
                    <li key={i}>
                      {isClickable ? (
                        <button className="dep-overview-path dep-overview-path-btn" onClick={() => onSelectFile && onSelectFile(r.to)}>
                          {r.to}
                        </button>
                      ) : (
                        <span className="dep-overview-path">{r.to}</span>
                      )}
                      <span className="dep-overview-desc">{r.description}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="dep-overview-none">No direct imports or dependencies</p>
            )}
          </div>

          <div className="dep-overview-card">
            <h3><span className="dep-arrow-out">{'\u2192'}</span> Used by</h3>
            {usedBy.length > 0 ? (
              <ul className="dep-overview-list">
                {usedBy.map((r, i) => {
                  const isClickable = importantFiles.some(f => f.path === r.from);
                  return (
                    <li key={i}>
                      {isClickable ? (
                        <button className="dep-overview-path dep-overview-path-btn" onClick={() => onSelectFile && onSelectFile(r.from)}>
                          {r.from}
                        </button>
                      ) : (
                        <span className="dep-overview-path">{r.from}</span>
                      )}
                      <span className="dep-overview-desc">{r.description}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="dep-overview-none">No files directly depend on this</p>
            )}
          </div>
        </div>

        {fileLayer && (
          <div className="dep-overview-section">
            <h3>Architecture layer</h3>
            <span className="dep-overview-layer-tag">{fileLayer.label}</span>
            <p className="dep-overview-layer-desc">{fileLayer.purpose}</p>
          </div>
        )}

        {relatedTracePaths.length > 0 && (
          <div className="dep-overview-section">
            <h3>Related trace paths</h3>
            {relatedTracePaths.map((tp, i) => (
              <div key={i} className="dep-overview-trace-item">
                <span className="dep-overview-trace-name">{tp.name}</span>
                <span className="dep-overview-trace-steps">{tp.steps.length} steps</span>
              </div>
            ))}
          </div>
        )}

        {fileImpact && (
          <div className="dep-overview-section">
            <h3>Impact scope</h3>
            <span className={`dep-scope-badge dep-scope-${fileImpact.level}`}>{fileImpact.level}</span>
            <p className="dep-overview-scope-desc">{fileImpact.explanation}</p>
          </div>
        )}

        {relatedDeps.length > 0 && (
          <div className="dep-overview-section">
            <h3>All relationships</h3>
            <div className="dep-overview-rels">
              {relatedDeps.map((r, i) => (
                <div key={i} className={`dep-overview-rel dep-rel-${r.type}`}>
                  <span className="dep-rel-path">{r.from}</span>
                  <span className="dep-rel-arrow">{'\u2192'}</span>
                  <span className="dep-rel-path">{r.to}</span>
                  <span className="dep-rel-type">{r.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}