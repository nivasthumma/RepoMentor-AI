import React from 'react';

export default function CodeRelationships({
  sourceCodeEntry,
  selectedFile,
  importantFiles,
  onSelectFile,
}) {
  if (!sourceCodeEntry || !selectedFile) return null;

  const fileInfo = importantFiles.find(f => f.path === selectedFile);

  const imports = [];
  const content = sourceCodeEntry.content;
  const importRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+(?:\s*,\s*\w+)*)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return (
    <section className="workspace-section code-relationships">
      <h2 className="section-title">Code Relationships</h2>
      <div className="code-rel-content">
        {imports.length > 0 && (
          <div className="code-rel-group">
            <h3 className="code-rel-heading">
              <span className="code-rel-icon">{'\u2190'}</span> Imports
            </h3>
            <ul className="code-rel-list">
              {imports.map((imp, i) => {
                const isClickable = importantFiles.some(f => f.path === imp);
                return (
                  <li key={i} className="code-rel-item">
                    {isClickable ? (
                      <button className="code-rel-btn" onClick={() => onSelectFile && onSelectFile(imp)}>
                        {imp}
                      </button>
                    ) : (
                      <span>{imp}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {sourceCodeEntry.functions && sourceCodeEntry.functions.length > 0 && (
          <div className="code-rel-group">
            <h3 className="code-rel-heading">
              <span className="code-rel-icon">{'\u2191'}</span> Exports / Functions
            </h3>
            <ul className="code-rel-list">
              {sourceCodeEntry.functions.map((f, i) => (
                <li key={i} className="code-rel-item">
                  <span className="code-rel-func-name">{f.name}</span>
                  <span className="code-rel-func-desc">{f.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fileInfo && fileInfo.directDependencies && fileInfo.directDependencies.length > 0 && (
          <div className="code-rel-group">
            <h3 className="code-rel-heading">
              <span className="code-rel-icon">{'\u2192'}</span> Direct dependencies
            </h3>
            <ul className="code-rel-list">
              {fileInfo.directDependencies.map((dep, i) => {
                const isClickable = importantFiles.some(f => f.path === dep);
                return (
                  <li key={i} className="code-rel-item">
                    {isClickable ? (
                      <button className="code-rel-btn" onClick={() => onSelectFile && onSelectFile(dep)}>
                        {dep}
                      </button>
                    ) : (
                      <span>{dep}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {fileInfo && fileInfo.relatedFiles && fileInfo.relatedFiles.length > 0 && (
          <div className="code-rel-group">
            <h3 className="code-rel-heading">
              <span className="code-rel-icon">{'\u21C4'}</span> Related files
            </h3>
            <ul className="code-rel-list">
              {fileInfo.relatedFiles.map((rf, i) => {
                const isClickable = importantFiles.some(f => f.path === rf);
                return (
                  <li key={i} className="code-rel-item code-rel-related">
                    {isClickable ? (
                      <button className="code-rel-btn" onClick={() => onSelectFile && onSelectFile(rf)}>
                        {rf}
                      </button>
                    ) : (
                      <span>{rf}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {fileInfo && fileInfo.connectedLayers && fileInfo.connectedLayers.length > 0 && (
          <div className="code-rel-group">
            <h3 className="code-rel-heading">
              <span className="code-rel-icon">{'\u25C8'}</span> Connected architecture layers
            </h3>
            <ul className="code-rel-list">
              {fileInfo.connectedLayers.map((layer, i) => (
                <li key={i} className="code-rel-item code-rel-layer">{layer}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}