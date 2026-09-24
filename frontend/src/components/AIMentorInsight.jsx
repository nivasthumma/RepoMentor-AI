import React, { useMemo } from 'react';

export default function AIMentorInsight({
  insights,
  selectedFile,
  selectedLayer,
  activeTaskId,
  selectedFunction,
  onSelectFile,
  onSelectLayer,
  onSelectFunction,
}) {
  const insight = useMemo(() => {
    if (!insights) return null;

    const conditions = [];

    if (activeTaskId) conditions.push(`task:${activeTaskId}`);
    if (selectedLayer) conditions.push(`layer:${selectedLayer}`);
    if (selectedFile) conditions.push(`file:${selectedFile}`);
    if (selectedFunction) conditions.push('function:selected');

    for (const cond of conditions) {
      const match = insights.find(i => i.condition === cond);
      if (match) return match;
    }

    if (selectedFile) {
      const match = insights.find(i => i.condition === 'default');
      return match || null;
    }

    return insights.find(i => i.condition === 'default') || null;
  }, [insights, selectedFile, selectedLayer, activeTaskId, selectedFunction]);

  if (!insight || !selectedFile) return null;

  const handleExplore = () => {
    if (!insight.action) return;
    switch (insight.action.type) {
      case 'selectFile':
        onSelectFile && onSelectFile(insight.action.value);
        break;
      case 'selectLayer':
        onSelectLayer && onSelectLayer(insight.action.value);
        break;
      case 'selectFunction':
        onSelectFunction && onSelectFunction(null);
        break;
      default:
        break;
    }
  };

  return (
    <div className="workspace-section ai-insight">
      <div className="ai-insight-content">
        <span className="ai-insight-badge">AI Mentor Insight</span>
        <p className="ai-insight-message">{insight.message}</p>
        <button className="ai-insight-action" onClick={handleExplore}>
          Explore this insight {'\u2192'}
        </button>
      </div>
    </div>
  );
}