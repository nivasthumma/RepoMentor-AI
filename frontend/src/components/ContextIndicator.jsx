import React from 'react';

export default function ContextIndicator({
  selectedFile,
  selectedFunction,
  currentLayer,
  activeTaskId,
  taskAnalyses,
}) {
  const activeTask = activeTaskId
    ? (taskAnalyses || []).find(t => t.id === activeTaskId)
    : null;

  return (
    <div className="context-indicator">
      <span className="context-indicator-item context-indicator-root">
        Repository
      </span>
      <span className="context-indicator-sep">{'\u203A'}</span>
      {selectedFile ? (
        <>
          <span className="context-indicator-item">{selectedFile.split('/').pop()}</span>
          {selectedFunction && (
            <>
              <span className="context-indicator-sep">{'\u203A'}</span>
              <span className="context-indicator-item context-indicator-active">{selectedFunction}</span>
            </>
          )}
          {currentLayer && (
            <>
              <span className="context-indicator-sep">{'\u203A'}</span>
              <span className="context-indicator-item">{currentLayer.label}</span>
            </>
          )}
        </>
      ) : (
        <span className="context-indicator-item">No file selected</span>
      )}
      {activeTask && (
        <>
          <span className="context-indicator-sep">{'\u203A'}</span>
          <span className="context-indicator-item context-indicator-task">{activeTask.taskQuery}</span>
        </>
      )}
    </div>
  );
}