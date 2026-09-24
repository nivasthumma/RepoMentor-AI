import React from 'react';
import StructureExplorer from './StructureExplorer';
import ArchitectureMap from './ArchitectureMap';
import AIExplanationPanel from './AIExplanationPanel';
import FirstContribution from './FirstContribution';
import TraceCodePath from './TraceCodePath';
import CodeViewer from './CodeViewer';
import FunctionIntelligence from './FunctionIntelligence';
import CodeRelationships from './CodeRelationships';
import PotentialImpact from './PotentialImpact';
import DependencyOverview from './DependencyOverview';
import ImpactPreview from './ImpactPreview';
import ImpactScopeIndicator from './ImpactScopeIndicator';
import ChangeChecklist from './ChangeChecklist';
import TaskNavigator from './TaskNavigator';
import WorkspaceIntro from './WorkspaceIntro';
import AIMentorInsight from './AIMentorInsight';
import ContextIndicator from './ContextIndicator';
import RepositoryHealth from './RepositoryHealth';
import RepositoryMap from './RepositoryMap';
import WalkthroughBanner from './WalkthroughBanner';
import ChangeSimulator from './ChangeSimulator';
import ThemeToggle from './ThemeToggle';

function getFileLayer(filePath, architecture) {
  if (!filePath) return null;
  for (const layer of architecture.layers) {
    if (layer.associatedFiles.includes(filePath)) {
      return layer;
    }
  }
  return null;
}

export default function PulseBoardWorkspace({
  data,
  sourceCode,
  selectedFile,
  selectedLayer,
  selectedRelationship,
  activeTracePath,
  activeTraceStep,
  contextualLoading,
  selectedFunction,
  aiState,
  expandedFolders,
  activeTaskId,
  guidedStep,
  onSelectFile,
  onSelectLayer,
  onSelectRelationship,
  onSelectFunction,
  onAiPrompt,
  onAiFileExplain,
  onAiTypedQuestion,
  onToggleFolder,
  onStartOnboarding,
  onFirstContributionPath,
  onStartTracePath,
  onTraceStepChange,
  onCloseTracePath,
  onTraceFromHere,
  onExplainCode,
  onExplainFunction,
  onWhatCouldBreak,
  onTaskSelectFile,
  onTaskSelectFunc,
  onTaskSelectLayer,
  onTaskSelect,
  onStartGuidedMode,
  getFileContextForLayer,
  repoMapView,
  onChangeRepoMapView,
  investigationHistory,
  activeInvestigation,
  investigationData,
  onInvestigationQuestion,
  onClearInvestigation,
  onInvestigationAction,
demoActive,
  demoStep,
  onStartWalkthrough,
  simulationTask,
  onSimulateChange,
  onExitSimulation,
  theme,
  onToggleTheme,
}) {
  const fileDetail = selectedFile
    ? data.importantFiles.find((f) => f.path === selectedFile)
    : null;

  const fileLayer = getFileLayer(selectedFile, data.architecture);

  const currentLayer = selectedLayer
    ? data.architecture.layers.find((l) => l.id === selectedLayer)
    : fileLayer;

  const sourceCodeEntry = selectedFile
    ? (sourceCode || {})[selectedFile]
    : null;

  const scopeData = selectedFile
    ? (data.impactScopes || {})[selectedFile]
    : null;

  const handleContributionExplore = (filePath) => {
    onFirstContributionPath(filePath);
  };

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-header-left">
          <h1 className="workspace-title">RepoMentor AI</h1>
          <span className="workspace-badge">{data.name}</span>
        </div>
        <div className="workspace-header-right">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="onboarding-start-btn" onClick={onStartOnboarding}>
            Start Onboarding
          </button>
        </div>
      </header>

      <WorkspaceIntro
        selectedFile={selectedFile}
        selectedLayer={selectedLayer}
        activeTaskId={activeTaskId}
        onStartOnboarding={onStartOnboarding}
        onStartTracePath={onStartTracePath}
        onFirstContributionPath={onFirstContributionPath}
        onStartGuidedMode={onStartGuidedMode}
        data={data}
      />

      {!selectedFile && !activeTaskId && !demoActive && (
        <WalkthroughBanner onStartWalkthrough={onStartWalkthrough} />
      )}

      {(selectedFile || selectedFunction || currentLayer || activeTaskId) && (
        <div className="workspace-context-bar">
          <ContextIndicator
            selectedFile={selectedFile}
            selectedFunction={selectedFunction}
            currentLayer={currentLayer}
            activeTaskId={activeTaskId}
            taskAnalyses={data.taskAnalyses}
          />
        </div>
      )}

      <div className="workspace-body">
        <aside className="workspace-sidebar">
          <section className="workspace-section">
            <h2 className="section-title">Technologies</h2>
            {data.technologies.length > 0 ? (
              <div className="tech-list">
                {data.technologies.map((t) => (
                  <span key={t} className="tech-label">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-message">No technologies listed.</p>
            )}
          </section>

          <section className="workspace-section">
            <h2 className="section-title">Important Files</h2>
            {data.importantFiles.length > 0 ? (
              <ul className="file-list">
                {data.importantFiles.map((f) => (
                  <li key={f.path} className="file-list-item">
                    <button
                      className={`file-list-path file-list-path-btn ${selectedFile === f.path ? 'file-list-path-selected' : ''}`}
                      onClick={() => onSelectFile(f.path)}
                    >
                      {f.path}
                    </button>
                    <span className="file-list-reason">{f.reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">No important files listed.</p>
            )}
          </section>

          <section className="workspace-section">
            <h2 className="section-title">Dependencies</h2>
            {data.dependencies.length > 0 ? (
              <ul className="dep-list">
                {data.dependencies.map((d) => (
                  <li key={d.name} className="dep-list-item">
                    <span className="dep-list-name">{d.name}</span>
                    <span className="dep-list-role">{d.role}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">No dependencies listed.</p>
            )}
          </section>

          <FirstContribution
            data={data.firstContribution}
            onPathClick={onFirstContributionPath}
            onStartExploring={handleContributionExplore}
          />

          <RepositoryHealth repoHealth={data.repoHealth} />
        </aside>

        <main className="workspace-main">
          <TaskNavigator
            taskAnalyses={data.taskAnalyses}
            onSelectTaskFile={onTaskSelectFile}
            onSelectTaskFunc={onTaskSelectFunc}
            onSelectTaskLayer={onTaskSelectLayer}
            onSelectTask={onTaskSelect}
            onStartGuidedMode={onStartGuidedMode}
            onSimulateChange={onSimulateChange}
            activeTaskId={activeTaskId}
            guidedStep={guidedStep}
          />

          {simulationTask && (
            <ChangeSimulator
              changePlan={data.changePlans ? data.changePlans[simulationTask] : null}
              taskName={simulationTask}
              onSelectFile={onSelectFile}
              onExitSimulation={onExitSimulation}
            />
          )}

          {contextualLoading && (
            <div className="contextual-loading">
              <div className="skeleton-bar skeleton-bar-title"></div>
              <div className="skeleton-bar skeleton-bar-text"></div>
              <div className="skeleton-bar skeleton-bar-text skeleton-bar-text-short"></div>
            </div>
          )}

          <AIMentorInsight
            insights={data.mentorInsights}
            selectedFile={selectedFile}
            selectedLayer={selectedLayer}
            activeTaskId={activeTaskId}
            selectedFunction={selectedFunction}
            onSelectFile={onSelectFile}
            onSelectLayer={onSelectLayer}
            onSelectFunction={onSelectFunction}
          />

          <section className="workspace-section">
            <h2 className="section-title">Structure Explorer</h2>
            <StructureExplorer
              hierarchy={data.hierarchy}
              importantFiles={data.importantFiles}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
            />
          </section>

          {fileDetail && !contextualLoading && (
            <section className="workspace-section file-detail">
              <h2 className="section-title">File Detail</h2>
              <div className="file-detail-content">
                <p className="file-detail-path">{fileDetail.path}</p>
                <p className="file-detail-role">{fileDetail.role}</p>
                {fileDetail.purpose && (
                  <p className="file-detail-purpose">
                    <strong>Purpose: </strong>{fileDetail.purpose}
                  </p>
                )}
                {fileDetail.importance && (
                  <p className="file-detail-importance">
                    <strong>Importance: </strong>{fileDetail.importance}
                  </p>
                )}
                <p className="file-detail-explanation">{fileDetail.explanation}</p>
                {fileDetail.directDependencies && fileDetail.directDependencies.length > 0 && (
                  <div className="file-detail-deps">
                    <h3>Direct Dependencies</h3>
                    <ul>
                      {fileDetail.directDependencies.map((dep) => (
                        <li key={dep}>{dep}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {fileDetail.relatedFiles && fileDetail.relatedFiles.length > 0 && (
                  <div className="file-detail-related">
                    <h3>Related Files</h3>
                    <ul>
                      {fileDetail.relatedFiles.map((rf) => (
                        <li key={rf}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {fileLayer && (
                  <div className="file-detail-layer">
                    <h3>Architecture Layer</h3>
                    <p>{fileLayer.label} — {fileLayer.purpose}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {!selectedFile && !contextualLoading && !activeTaskId && (
            <section className="workspace-section">
              <div className="empty-state">
                <p className="empty-state-icon">{'\u25CB'}</p>
                <h3 className="empty-state-title">No file selected</h3>
                <p className="empty-state-text">
                  Select an important file from the Structure Explorer to see its source code, dependencies, impact, and architecture context. Or describe a task in the AI Task Navigator above.
                </p>
              </div>
            </section>
          )}

          {sourceCodeEntry && !contextualLoading && (
            <>
              <CodeViewer
                sourceCodeEntry={sourceCodeEntry}
                selectedFile={selectedFile}
                selectedFunction={selectedFunction}
                onSelectFunction={onSelectFunction}
                onExplainCode={onExplainCode}
                onExplainFunction={onExplainFunction}
              />

              {selectedFunction && (
                <>
                  <FunctionIntelligence
                    functionData={selectedFunction}
                    selectedFile={selectedFile}
                    sourceCodeEntry={sourceCodeEntry}
                    onExplainFunction={onExplainFunction}
                    onTraceFromHere={onTraceFromHere}
                  />

                  <PotentialImpact
                    functionData={selectedFunction}
                    sourceCodeEntry={sourceCodeEntry}
                    selectedFile={selectedFile}
                    importantFiles={data.importantFiles}
                  />
                </>
              )}

              <CodeRelationships
                sourceCodeEntry={sourceCodeEntry}
                selectedFile={selectedFile}
                importantFiles={data.importantFiles}
                onSelectFile={onSelectFile}
              />
            </>
          )}

          {!sourceCodeEntry && !selectedFile && !contextualLoading && !activeTaskId && (
            <section className="workspace-section">
              <div className="empty-state">
                <p className="empty-state-icon">{'\u2316'}</p>
                <h3 className="empty-state-title">No code intelligence available</h3>
                <p className="empty-state-text">
                  This file does not have source-code annotations in the sample repository.
                  Select one of the important files to see its code, functions, and relationships.
                </p>
              </div>
            </section>
          )}

          {selectedFile && !contextualLoading && (
            <DependencyOverview
              filePath={selectedFile}
              dependencyRelationships={data.dependencyRelationships}
              importantFiles={data.importantFiles}
              architecture={data.architecture}
              traceCodePaths={data.traceCodePaths}
              impactScopes={data.impactScopes}
              onSelectFile={onSelectFile}
            />
          )}

          {selectedFile && !contextualLoading && (
            <ImpactPreview
              selectedFile={selectedFile}
              selectedFunction={selectedFunction}
              dependencyRelationships={data.dependencyRelationships}
              importantFiles={data.importantFiles}
              architecture={data.architecture}
              onSelectFile={onSelectFile}
            />
          )}

          {selectedFile && !contextualLoading && (
            <ImpactScopeIndicator scopeData={scopeData} />
          )}

          {selectedFile && !contextualLoading && (
            <ChangeChecklist
              filePath={selectedFile}
              functionName={selectedFunction}
              changeChecklists={data.changeChecklists}
            />
          )}

          <RepositoryMap
            view={repoMapView}
            onChangeView={onChangeRepoMapView}
            architecture={data.architecture}
            selectedLayer={selectedLayer}
            selectedRelationship={selectedRelationship}
            selectedFile={selectedFile}
            onSelectLayer={onSelectLayer}
            onSelectRelationship={onSelectRelationship}
            getFileContextForLayer={getFileContextForLayer}
            hierarchy={data.hierarchy}
            importantFiles={data.importantFiles}
            expandedFolders={expandedFolders}
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
            dependencyRelationships={data.dependencyRelationships}
          />

          {!selectedLayer && !selectedFile && !selectedRelationship && !contextualLoading && !activeTaskId && (
            <section className="workspace-section">
              <div className="empty-state">
                <p className="empty-state-icon">{'\u2B21'}</p>
                <h3 className="empty-state-title">No architecture layer selected</h3>
                <p className="empty-state-text">
                  Click on a layer above to see its files and connections, or select an important file to highlight its layer.
                </p>
              </div>
            </section>
          )}

          <TraceCodePath
            traceCodePaths={data.traceCodePaths}
            activeTracePath={activeTracePath}
            activeTraceStep={activeTraceStep}
            onStartTracePath={onStartTracePath}
            onTraceStepChange={onTraceStepChange}
            onCloseTracePath={onCloseTracePath}
          />
        </main>

        <aside className="workspace-ai">
          <AIExplanationPanel
            curatedAnswers={data.curatedAnswers}
            contextualAnswers={data.contextualAnswers}
            fileExplanations={data.fileExplanations}
            selectedFile={selectedFile}
            selectedFunction={selectedFunction}
            aiState={aiState}
            onPrompt={onAiPrompt}
            onFileExplain={onAiFileExplain}
            onTypedQuestion={onAiTypedQuestion}
            onWhatCouldBreak={onWhatCouldBreak}
            whatCouldBreak={data.whatCouldBreak}
            investigationData={investigationData}
            investigationHistory={investigationHistory}
            activeInvestigation={activeInvestigation}
            onInvestigationQuestion={onInvestigationQuestion}
            onClearInvestigation={onClearInvestigation}
            onInvestigationAction={onInvestigationAction}
          />
        </aside>
      </div>
    </div>
  );
}
