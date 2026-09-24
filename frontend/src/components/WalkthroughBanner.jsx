import React from 'react';

const STEPS = [
  { label: 'Architecture', desc: 'View the 5-layer architecture map' },
  { label: 'LoginPage.tsx', desc: 'Inspect the authentication entry point' },
  { label: 'authService.ts', desc: 'Trace the frontend auth service' },
  { label: 'Trace authentication', desc: 'Follow the auth flow end-to-end' },
  { label: 'Dependency impact', desc: 'See what depends on auth' },
  { label: 'Ask RepoMentor', desc: 'Investigate the codebase with AI' },
  { label: 'First Contribution', desc: 'Find where to start contributing' },
];

export default function WalkthroughBanner({ onStartWalkthrough }) {
  return (
    <div className="walkthrough-banner">
      <div className="walkthrough-banner-content">
        <div className="walkthrough-banner-info">
          <h3 className="walkthrough-banner-title">Try the 30-second walkthrough</h3>
          <p className="walkthrough-banner-desc">
            See how RepoMentor maps architecture, code, dependencies, and impact — in under a minute.
          </p>
        </div>
        <button className="walkthrough-banner-btn" onClick={onStartWalkthrough}>
          {'\u25B6'} Start walkthrough
        </button>
      </div>
      <div className="walkthrough-banner-steps">
        {STEPS.map((s, i) => (
          <span key={i} className="walkthrough-banner-step">
            <span className="walkthrough-banner-step-num">{i + 1}</span>
            <span className="walkthrough-banner-step-label">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}