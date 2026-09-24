import React from 'react';

const SCOPE_META = {
  'local': { icon: '\u25CB', color: 'var(--success)', desc: 'Changes are isolated to a single file or concern.' },
  'module': { icon: '\u25B3', color: 'var(--warning)', desc: 'Changes affect a single module or component subtree.' },
  'cross-module': { icon: '\u25A1', color: 'var(--danger)', desc: 'Changes propagate across multiple modules or layers.' },
  'system-wide': { icon: '\u2B1B', color: 'var(--danger)', desc: 'Changes can affect the entire application end-to-end.' },
};

export default function ImpactScopeIndicator({ scopeData }) {
  if (!scopeData) {
    return (
      <section className="workspace-section impact-scope">
        <h2 className="section-title">Impact Scope</h2>
        <div className="impact-scope-content">
          <p className="dep-overview-none">Select an important file to see its impact scope.</p>
        </div>
      </section>
    );
  }

  const { level, explanation, affectedLayers } = scopeData;
  const meta = SCOPE_META[level] || SCOPE_META['local'];
  const levels = ['local', 'module', 'cross-module', 'system-wide'];

  return (
    <section className="workspace-section impact-scope">
      <h2 className="section-title">Impact Scope</h2>
      <div className="impact-scope-content">
        <div className="impact-scope-visual">
          {levels.map((l) => (
            <div
              key={l}
              className={`impact-scope-step ${levels.indexOf(l) <= levels.indexOf(level) ? 'impact-scope-step-active' : ''} ${l === level ? 'impact-scope-step-current' : ''}`}
            >
              <span className="impact-scope-step-icon" style={l === level ? { color: meta.color, borderColor: meta.color } : undefined}>
                {l === level ? '\u25C9' : levels.indexOf(l) <= levels.indexOf(level) ? '\u25CF' : '\u25CB'}
              </span>
              <span className="impact-scope-step-label">{l.replace('-', ' ')}</span>
            </div>
          ))}
        </div>

        <div className="impact-scope-result">
          <span className="impact-scope-level" style={{ color: meta.color, borderColor: meta.color }}>
            {meta.icon} {level.replace('-', ' ')}
          </span>
          <p className="impact-scope-explanation">{explanation}</p>
        </div>

        {affectedLayers && affectedLayers.length > 0 && (
          <div className="impact-scope-layers">
            <h3>Affected architecture layers</h3>
            <div className="impact-scope-layer-tags">
              {affectedLayers.map(l => (
                <span key={l} className="impact-scope-layer-tag">{l}</span>
              ))}
            </div>
          </div>
        )}

        <p className="impact-scope-note">
          {meta.desc} This assessment is based on the curated PulseBoard sample repository
          and describes plausible relationships between components.
        </p>
      </div>
    </section>
  );
}