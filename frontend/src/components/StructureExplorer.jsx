import React from 'react';

function TreeNode({ node, path, importantFiles, selectedFile, expandedFolders, onSelectFile, onToggleFolder }) {
  const isImportant = importantFiles.some((f) => f.path === path);
  const isSelected = selectedFile === path;
  const isExpanded = expandedFolders.has(path);

  if (node.type === 'file') {
    return (
      <div
        className={`tree-file ${isImportant ? 'tree-file-important' : ''} ${isSelected ? 'tree-file-selected' : ''}`}
        onClick={() => isImportant && onSelectFile(path)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isImportant) onSelectFile(path);
          }
        }}
        aria-selected={isSelected}
        aria-label={`File: ${node.name}${isImportant ? ' (important)' : ''}`}
      >
        <span className="tree-file-icon">{isImportant ? '\u2605' : '\u2502'}</span>
        <span className="tree-file-name">{node.name}</span>
      </div>
    );
  }

  return (
    <div className="tree-folder">
      <div
        className="tree-folder-header"
        onClick={() => onToggleFolder(path)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleFolder(path);
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`Folder: ${node.name}`}
      >
        <span className="tree-folder-icon">{isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span className="tree-folder-name">{node.name}</span>
      </div>
      {isExpanded && node.children && (
        <div className="tree-folder-children">
          {node.children.map((child) => {
            const childPath = path ? `${path}/${child.name}` : child.name;
            return (
              <TreeNode
                key={childPath}
                node={child}
                path={childPath}
                importantFiles={importantFiles}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onSelectFile={onSelectFile}
                onToggleFolder={onToggleFolder}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StructureExplorer({
  hierarchy,
  importantFiles,
  selectedFile,
  expandedFolders,
  onSelectFile,
  onToggleFolder,
}) {
  return (
    <div className="structure-explorer">
      <TreeNode
        node={hierarchy}
        path=""
        importantFiles={importantFiles}
        selectedFile={selectedFile}
        expandedFolders={expandedFolders}
        onSelectFile={onSelectFile}
        onToggleFolder={onToggleFolder}
      />
    </div>
  );
}