import React from 'react';

const QUICK_ACTIONS = [
  {
    id: 'understand',
    label: 'Understand this repository',
    desc: 'Explore architecture layers, key files, and data flow',
    icon: '\u25B3',
  },
  {
    id: 'trace-auth',
    label: 'Trace authentication',
    desc: 'Follow the auth flow from frontend to database',
    icon: '\u2192',
  },
  {
    id: 'first-contribution',
    label: 'Find my first contribution',
    desc: 'Discover where to start contributing',
    icon: '\u2605',
  },
  {
    id: 'guide-task',
    label: 'Guide me through a development task',
    desc: 'Describe a task and get a guided analysis',
    icon: '\u25B6',
  },
];

export default function WorkspaceIntro({
  selectedFile,
  selectedLayer,
  activeTaskId,
  onStartOnboarding,
  onStartTracePath,
  onFirstContributionPath,
  onStartGuidedMode,
  data,
}) {
  const hasContext = selectedFile || selectedLayer || activeTaskId;

  const handleAction = (id) => {
    switch (id) {
      case 'understand':
        onStartOnboarding();
        break;
      case 'trace-auth':
        onStartTracePath(0);
        break;
      case 'first-contribution':
        onFirstContributionPath(data.firstContribution.relevantPath);
        break;
      case 'guide-task':
        break;
      default:
        break;
    }
  };

  return (
    <div className={`workspace-intro ${hasContext ? 'workspace-intro-context' : ''}`}>
      <div className="workspace-intro-main">
        <h2 className="workspace-intro-tagline">
          Understand an unfamiliar codebase in minutes.
        </h2>
        <p className="workspace-intro-desc">
          RepoMentor maps architecture, code relationships, dependencies, impact, and development tasks
          so you can navigate any repository with confidence.
        </p>
      </div>

      {!hasContext && (
        <div className="workspace-intro-quickstart">
          <p className="workspace-intro-label">Quick Start</p>
          <div className="workspace-intro-actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                className="workspace-intro-action"
                onClick={() => handleAction(action.id)}
              >
                <span className="workspace-intro-action-icon">{action.icon}</span>
                <div className="workspace-intro-action-info">
                  <span className="workspace-intro-action-label">{action.label}</span>
                  <span className="workspace-intro-action-desc">{action.desc}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="workspace-intro-recommend">
            Start with: <button className="workspace-intro-link" onClick={() => onStartTracePath(0)}>
              Understand the login flow
            </button>
          </p>
        </div>
      )}
    </div>
  );
}