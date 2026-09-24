import React from 'react';

export default function RepositoryHealth({ repoHealth }) {
  if (!repoHealth) return null;

  return (
    <section className="workspace-section repo-health">
      <h2 className="section-title">Repository Health</h2>
      <div className="repo-health-content">
        <div className="repo-health-item">
          <span className="repo-health-label">Architecture style</span>
          <p className="repo-health-text">{repoHealth.architectureStyle}</p>
        </div>

        <div className="repo-health-item">
          <span className="repo-health-label">Primary technologies</span>
          <div className="repo-health-tags">
            {repoHealth.primaryTechnologies.map((t, i) => (
              <span key={i} className="repo-health-tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="repo-health-item">
          <span className="repo-health-label">Major modules</span>
          <div className="repo-health-tags">
            {repoHealth.majorModules.map((m, i) => (
              <span key={i} className="repo-health-tag repo-health-tag-module">{m}</span>
            ))}
          </div>
        </div>

        <div className="repo-health-item">
          <span className="repo-health-label">API surface</span>
          <ul className="repo-health-list">
            {repoHealth.apiSurface.map((a, i) => (
              <li key={i} className="repo-health-api">{a}</li>
            ))}
          </ul>
        </div>

        <div className="repo-health-item">
          <span className="repo-health-label">Data layer</span>
          <p className="repo-health-text">{repoHealth.dataLayer}</p>
        </div>

        <div className="repo-health-item">
          <span className="repo-health-label">Test coverage areas</span>
          <ul className="repo-health-list">
            {repoHealth.testCoverageAreas.map((tc, i) => (
              <li key={i} className="repo-health-test-area">{tc}</li>
            ))}
          </ul>
          <p className="repo-health-illustrative">
            Coverage described as areas only — no exact percentages are claimed for the sample data.
          </p>
        </div>
      </div>
    </section>
  );
}