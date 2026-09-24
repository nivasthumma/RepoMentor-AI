import React, { useState } from 'react';

export default function ImpactPreview({
  selectedFile,
  selectedFunction,
  dependencyRelationships,
  importantFiles,
  architecture,
  onSelectFile,
}) {
  const [expandedNode, setExpandedNode] = useState(null);

  if (!selectedFile) return null;

  const fileInfo = importantFiles.find(f => f.path === selectedFile);
  if (!fileInfo) return null;

  const fileImpactLevel = 'impactScopes' in (importantFiles[0] || {}) ? null : null;

  const directlyAffected = dependencyRelationships
    ? dependencyRelationships.filter(r => r.from === selectedFile || r.to === selectedFile)
    : [];

  const indirectlyAffected = directlyAffected.length > 0
    ? dependencyRelationships
        ?.filter(r =>
          r.type !== 'imports' &&
          (directlyAffected.some(d => d.from === r.from || d.to === r.to || d.from === r.to || d.to === r.from))
        )
        .filter(r => r.from !== selectedFile && r.to !== selectedFile)
        .slice(0, 6)
    : [];

  const fileLayerIds = fileInfo.connectedLayers || [];
  const affectedLayers = architecture.layers.filter(l => fileLayerIds.includes(l.id));

  const nodes = [
    {
      id: 'selected',
      label: selectedFile.split('/').pop(),
      fullPath: selectedFile,
      type: 'selected',
      layer: fileLayerIds[0] || null,
    },
    ...directlyAffected.filter((r, i, arr) =>
      arr.findIndex(d => d.from === r.from || d.to === r.to) === i
    ).slice(0, 4).map(r => ({
      id: r.from === selectedFile ? r.to : r.from,
      label: (r.from === selectedFile ? r.to : r.from).split('/').pop(),
      fullPath: r.from === selectedFile ? r.to : r.from,
      type: 'direct',
      layer: null,
    })),
    ...indirectlyAffected.slice(0, 4).flatMap(r => [r.from, r.to])
      .filter((p, i, arr) => arr.indexOf(p) === i && p !== selectedFile && !directlyAffected.some(d => d.from === p || d.to === p))
      .slice(0, 3)
      .map(p => ({
        id: p,
        label: p.split('/').pop(),
        fullPath: p,
        type: 'indirect',
        layer: null,
      })),
  ];

  const handleNodeClick = (fullPath) => {
    const impFile = importantFiles.find(f => f.path === fullPath);
    if (impFile && onSelectFile) {
      onSelectFile(fullPath);
    } else {
      setExpandedNode(expandedNode === fullPath ? null : fullPath);
    }
  };

  return (
    <section className="workspace-section impact-preview">
      <h2 className="section-title">Impact Preview</h2>
      <div className="impact-preview-content">
        <div className="impact-graph">
          {nodes.map((node, i) => (
            <React.Fragment key={node.id}>
              {i > 0 && (
                <div className="impact-graph-connector">
                  <span className="impact-graph-arrow">{'\u2193'}</span>
                </div>
              )}
              <div
                className={`impact-graph-node impact-node-${node.type} ${expandedNode === node.fullPath ? 'impact-node-expanded' : ''}`}
                onClick={() => handleNodeClick(node.fullPath)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNodeClick(node.fullPath); }}
                aria-label={`Click to select ${node.label}`}
              >
                <span className="impact-node-layer-indicator" style={node.layer ? { background: 'var(--accent)' } : undefined}></span>
                <div className="impact-node-body">
                  <span className="impact-node-label">{node.label}</span>
                  <span className="impact-node-type">{node.type}</span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="impact-areas">
          <h3>Architecture areas affected</h3>
          <div className="impact-areas-list">
            {affectedLayers.length > 0 ? affectedLayers.map(layer => (
              <span key={layer.id} className="impact-area-tag">{layer.label}</span>
            )) : (
              <p className="dep-overview-none">No specific architecture layers identified</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}