import React from 'react';

const DEMO_STEPS = [
  {
    title: 'Repository Loaded',
    context: 'PulseBoard is a real-time team analytics dashboard built with React, Express, and PostgreSQL.',
    highlight: 'workspace-intro',
    action: null,
  },
  {
    title: 'Architecture Overview',
    context: 'PulseBoard has 5 layers: Frontend, APIs, Backend, Services, and Database. The Repository Map shows how they connect.',
    highlight: 'repository-map',
    action: { type: 'setRepoMapView', value: 'architecture' },
  },
  {
    title: 'LoginPage.tsx',
    context: 'LoginPage is the authentication entry point. It calls authService to sign users in and redirects to the dashboard.',
    highlight: 'file-detail',
    action: { type: 'selectFile', value: 'src/pages/LoginPage.tsx' },
  },
  {
    title: 'authService.ts',
    context: 'authService wraps the login API calls and manages the session token. Every authenticated request depends on it.',
    highlight: 'code-viewer',
    action: { type: 'selectFile', value: 'src/services/authService.ts' },
  },
  {
    title: 'Trace Authentication Flow',
    context: 'The Login to Dashboard Flow traces the auth path: LoginPage → authService → API client → controller → service → repository.',
    highlight: 'trace-path',
    action: { type: 'startTracePath', value: 0 },
  },
  {
    title: 'Dependency Impact',
    context: 'authService is cross-module — a change here affects every authenticated page. The Dependency Overview shows what depends on it.',
    highlight: 'dependency-overview',
    action: { type: 'selectFile', value: 'src/services/authService.ts' },
  },
  {
    title: 'Ask RepoMentor',
    context: 'The AI panel lets you investigate the codebase. Try asking "Walk me through this request" to trace the full data flow.',
    highlight: 'ai-panel',
    action: null,
  },
  {
    title: 'First Contribution',
    context: 'The best starting point is adding a new DataSource adapter. It is self-contained and teaches you the aggregation pipeline.',
    highlight: 'first-contribution',
    action: { type: 'firstContribution', value: null },
  },
];

export default function DemoMode({
  demoStep,
  onDemoStepChange,
  onDemoAction,
  onExitDemo,
}) {
  if (demoStep === null || demoStep >= DEMO_STEPS.length) return null;

  const step = DEMO_STEPS[demoStep];
  const total = DEMO_STEPS.length;

  const handleGo = (direction) => {
    const next = demoStep + direction;
    if (next < 0 || next >= total) return;
    onDemoStepChange(next);
    const s = DEMO_STEPS[next];
    if (s.action) onDemoAction(s.action);
  };

  return (
    <>
      <div className="demo-backdrop" />
      <div className="demo-overlay">
        <div className="demo-panel">
          <div className="demo-header">
            <h2 className="demo-title">Demo Walkthrough</h2>
            <button className="demo-close" onClick={onExitDemo} aria-label="Exit demo">
              {'\u2715'}
            </button>
          </div>

          <div className="demo-progress">
            <span className="demo-step-label">{demoStep + 1} / {total}</span>
            <div className="demo-progress-bar">
              <div className="demo-progress-fill" style={{ width: `${((demoStep + 1) / total) * 100}%` }}></div>
            </div>
          </div>

          <div className="demo-content">
            <h3 className="demo-step-title">{step.title}</h3>
            <p className="demo-step-context">{step.context}</p>
          </div>

          <div className="demo-actions">
            {step.action && (
              <button className="demo-action-btn" onClick={() => { onDemoAction(step.action); }}>
                {'\u25B6'} Show me
              </button>
            )}
          </div>

          <div className="demo-nav">
            <button className="demo-nav-btn" disabled={demoStep === 0} onClick={() => handleGo(-1)}>
              {'\u25C0'} Previous
            </button>
            {demoStep < total - 1 ? (
              <button className="demo-nav-btn demo-nav-primary" onClick={() => handleGo(1)}>
                Next {'\u25B6'}
              </button>
            ) : (
              <button className="demo-nav-btn demo-nav-primary" onClick={onExitDemo}>
                Done {'\u2713'}
              </button>
            )}
          </div>

          <button className="demo-done-btn" onClick={onExitDemo}>
            Exit walkthrough
          </button>
        </div>
      </div>
    </>
  );
}