import React from 'react';

const ALLOWED_LAYER_LABELS = new Set(['Frontend', 'Backend', 'APIs', 'Services', 'Database']);

export default function ArchitectureMap({
  architecture,
  selectedLayer,
  selectedRelationship,
  selectedFile,
  onSelectLayer,
  onSelectRelationship,
  onSelectFile,
  getFileContextForLayer,
}) {
  if (!architecture || !architecture.relationships || architecture.relationships.length === 0) {
    return (
      <section className="workspace-section">
        <h2 className="section-title">Architecture Map</h2>
        <p className="empty-message">No architecture relationships defined.</p>
      </section>
    );
  }

  const filteredLayers = architecture.layers.filter((l) => ALLOWED_LAYER_LABELS.has(l.label));

  const fileLayerId = selectedFile ? getFileContextForLayer(selectedFile) : null;

  const selectedLayerData = filteredLayers.find((l) => l.id === selectedLayer);
  const selectedRelData = selectedRelationship !== null
    ? architecture.relationships[selectedRelationship]
    : null;

  const connectedLayerIds = new Set();
  if (selectedLayer) {
    connectedLayerIds.add(selectedLayer);
    architecture.relationships.forEach((r) => {
      if (r.from === selectedLayer) connectedLayerIds.add(r.to);
      if (r.to === selectedLayer) connectedLayerIds.add(r.from);
    });
  }

  const fileLayer = fileLayerId ? filteredLayers.find((l) => l.id === fileLayerId) : null;

  return (
    <section className="workspace-section">
      <h2 className="section-title">Architecture Map</h2>
      {fileLayer && !selectedLayer && (
        <p className="arch-file-context">
          File in layer: <strong>{fileLayer.label}</strong>
        </p>
      )}
      <div className="arch-map">
        <div className="arch-layers">
          {filteredLayers.map((layer) => {
            const isSelected = layer.id === selectedLayer;
            const isFileLayer = !selectedLayer && layer.id === fileLayerId;
            const isConnected = !selectedLayer || connectedLayerIds.has(layer.id);
            return (
              <button
                key={layer.id}
                className={`arch-layer ${isSelected ? 'arch-layer-selected' : ''} ${isFileLayer ? 'arch-layer-file-context' : ''} ${!isConnected && selectedLayer ? 'arch-layer-dimmed' : ''}`}
                onClick={() => onSelectLayer(layer.id)}
                aria-pressed={isSelected}
                aria-label={`Layer: ${layer.label}`}
              >
                {layer.label}
              </button>
            );
          })}
        </div>
        <div className="arch-legend">
          <span className="arch-legend-item">
            <span className="arch-legend-dot arch-legend-dot-layer"></span> Layer
          </span>
          <span className="arch-legend-item">
            <span className="arch-legend-dot arch-legend-dot-rel"></span> Data flow
          </span>
          <span className="arch-legend-item">
            <span className="arch-legend-dot arch-legend-dot-selected"></span> Selected
          </span>
          <span className="arch-legend-item">
            <span className="arch-legend-dot arch-legend-dot-context"></span> File context
          </span>
        </div>
        <div className="arch-relationships">
          {architecture.relationships.map((r, i) => {
            const fromLayer = filteredLayers.find((l) => l.id === r.from);
            const toLayer = filteredLayers.find((l) => l.id === r.to);
            const isHighlighted =
              !selectedLayer ||
              r.from === selectedLayer ||
              r.to === selectedLayer;
            const isSelectedRel = selectedRelationship === i;
            const isFileConnected =
              fileLayerId && (r.from === fileLayerId || r.to === fileLayerId);
            return (
              <button
                key={i}
                className={`arch-rel ${isHighlighted ? 'arch-rel-highlighted' : 'arch-rel-dimmed'} ${isSelectedRel ? 'arch-rel-active' : ''} ${isFileConnected && !selectedLayer && !selectedRelationship ? 'arch-rel-file-highlight' : ''}`}
                onClick={() => onSelectRelationship(i)}
                aria-label={`Relationship: ${fromLayer?.label || r.from} to ${toLayer?.label || r.to}`}
              >
                <span className="arch-rel-from">{fromLayer?.label || r.from}</span>
                <span className="arch-rel-arrow-wrap">
                  <span className="arch-rel-arrow-line"></span>
                  <span className="arch-rel-arrow-head">{'\u25B6'}</span>
                </span>
                <span className="arch-rel-to">{toLayer?.label || r.to}</span>
                <span className="arch-rel-label">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {selectedRelData && (
        <div className="arch-detail">
          <h3 className="arch-detail-title">
            {filteredLayers.find((l) => l.id === selectedRelData.from)?.label || selectedRelData.from}
            {' \u2192 '}
            {filteredLayers.find((l) => l.id === selectedRelData.to)?.label || selectedRelData.to}
          </h3>
          <p className="arch-detail-purpose">{selectedRelData.dataFlow || selectedRelData.label}</p>
          <p className="arch-detail-rel-label">
            <strong>Relationship: </strong>{selectedRelData.label}
          </p>
        </div>
      )}
      {selectedLayerData && !selectedRelData && (
        <div className="arch-detail">
          <h3 className="arch-detail-title">{selectedLayerData.label}</h3>
          <p className="arch-detail-purpose">{selectedLayerData.purpose}</p>
          {selectedLayerData.associatedFiles.length > 0 && (
            <div className="arch-detail-files">
              <h4>Associated Files</h4>
              <ul>
                {selectedLayerData.associatedFiles.map((f) => (
                  <li key={f}>
                    <button className="arch-detail-file-btn" onClick={() => onSelectFile && onSelectFile(f)}>
                      {f}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}