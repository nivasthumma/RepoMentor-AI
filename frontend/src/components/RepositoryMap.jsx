import React from 'react';
import ArchitectureMap from './ArchitectureMap';
import StructureExplorer from './StructureExplorer';

const VIEWS = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'structure', label: 'File Structure' },
  { id: 'dependencies', label: 'Dependencies' },
];

export default function RepositoryMap({
  view,
  onChangeView,
  architecture,
  selectedLayer,
  selectedRelationship,
  selectedFile,
  onSelectLayer,
  onSelectRelationship,
  getFileContextForLayer,
  hierarchy,
  importantFiles,
  expandedFolders,
  onSelectFile,
  onToggleFolder,
  dependencyRelationships,
}) {
  return (
    <section className="workspace-section repository-map">
      <div className="repository-map-header">
        <h2 className="section-title">Repository Map</h2>
        <div className="repository-map-toggle" role="tablist" aria-label="Repository map view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              className={`repository-map-tab ${view === v.id ? 'repository-map-tab-active' : ''}`}
              onClick={() => onChangeView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="repository-map-body">
        {view === 'architecture' && (
          <ArchitectureMap
            architecture={architecture}
            selectedLayer={selectedLayer}
            selectedRelationship={selectedRelationship}
            selectedFile={selectedFile}
            onSelectLayer={onSelectLayer}
            onSelectRelationship={onSelectRelationship}
            onSelectFile={onSelectFile}
            getFileContextForLayer={getFileContextForLayer}
          />
        )}

        {view === 'structure' && (
          <div className="repository-map-structure">
            <p className="repository-map-hint">
              Browse the repository tree. Important files are marked with a star.
            </p>
            <StructureExplorer
              hierarchy={hierarchy}
              importantFiles={importantFiles}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
            />
          </div>
        )}

        {view === 'dependencies' && (
          <div className="repository-map-dependencies">
            <p className="repository-map-hint">
              Files and the direction of their relationships ({dependencyRelationships ? dependencyRelationships.length : 0} curated edges).
            </p>
            <div className="repository-map-dep-list">
              {(dependencyRelationships || []).map((r, i) => {
                const fromIsImportant = importantFiles.some(f => f.path === r.from);
                const toIsImportant = importantFiles.some(f => f.path === r.to);
                return (
                  <div key={i} className="repository-map-dep-row">
                    <div className="repository-map-dep-end">
                      <span className={`repository-map-dep-name ${fromIsImportant ? 'repository-map-dep-important' : ''}`}>
                        {r.from}
                      </span>
                    </div>
                    <span className="repository-map-dep-arrow">
                      {r.type === 'imports' ? '\u2190' : r.type === 'depends-on' ? '\u2190' : '\u21C4'}
                    </span>
                    <div className="repository-map-dep-end">
                      <span className={`repository-map-dep-name ${toIsImportant ? 'repository-map-dep-important' : ''}`}>
                        {r.to}
                      </span>
                    </div>
                    <span className="repository-map-dep-type">{r.type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}