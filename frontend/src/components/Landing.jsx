import React, { useState } from 'react';

function isValidGitHubUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }
  if (url.host !== 'github.com') return false;
  const segments = url.pathname.replace(/^\/|\/$/g, '').split('/');
  return segments.length === 2 && segments[0].length > 0 && segments[1].length > 0;
}

export default function Landing({ onLoadSample }) {
  const [inputValue, setInputValue] = useState('');
  const [validationMessage, setValidationMessage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || !isValidGitHubUrl(trimmed)) {
      setValidationMessage('invalid');
      return;
    }
    setValidationMessage('valid_unavailable');
  };

  return (
    <div className="landing">
      <div className="landing-content">
        <div className="landing-preview">
          <div className="landing-preview-bar"><span></span><span></span><span></span></div>
          <div className="landing-preview-body">
            <div className="landing-preview-line landing-preview-line-short"></div>
            <div className="landing-preview-line"></div>
            <div className="landing-preview-line landing-preview-line-med"></div>
            <div className="landing-preview-grid">
              <div className="landing-preview-box"></div>
              <div className="landing-preview-box"></div>
              <div className="landing-preview-box"></div>
            </div>
          </div>
        </div>

        <h1 className="landing-title"><span>RepoMentor AI</span></h1>
        <p className="landing-subtitle">
          Understand an unfamiliar codebase in minutes.
        </p>
        <p className="landing-description">
          Explore architecture, trace code paths, understand dependencies, predict change impact,
          and let an AI mentor guide you through development tasks.
        </p>
        <p className="landing-demo-note">
          This demo uses curated sample data (PulseBoard) to demonstrate how RepoMentor AI helps
          you learn a project without cloning or configuring anything.
        </p>

        <form className="landing-form" onSubmit={handleSubmit}>
          <div className="landing-input-group">
            <input
              type="text"
              className="landing-input"
              placeholder="https://github.com/owner/repository"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setValidationMessage(null);
              }}
              aria-label="GitHub repository URL"
            />
            <button type="submit" className="landing-submit-btn">
              Explore
            </button>
          </div>
        </form>

        {validationMessage === 'invalid' && (
          <p className="landing-validation" role="alert">
            Please enter a valid GitHub repository URL in the format
            https://github.com/owner/repository.
          </p>
        )}

        {validationMessage === 'valid_unavailable' && (
          <div className="landing-unavailable" role="alert">
            <p>
              Live repository loading is not available in this prototype.
            </p>
            <button className="landing-sample-btn" onClick={onLoadSample}>
              Load Sample Repository
            </button>
          </div>
        )}

        <div className="landing-divider">
          <span>or</span>
        </div>

        <button className="landing-sample-btn landing-sample-primary" onClick={onLoadSample}>
          Load Sample Repository
        </button>

        <div className="landing-features">
          <span>Architecture Map</span>
          <span>Code Intelligence</span>
          <span>Trace Paths</span>
          <span>Impact Analysis</span>
          <span>Dependency Insights</span>
          <span>AI Task Mentor</span>
        </div>
      </div>
    </div>
  );
}