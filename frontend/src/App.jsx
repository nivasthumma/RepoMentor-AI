import React, { useState, useCallback, useEffect } from 'react';
import { pulseboardData } from './data/pulseboard';
import { sourceCode } from './data/sourceCode';
import Landing from './components/Landing';
import PulseBoardWorkspace from './components/PulseBoardWorkspace';
import OnboardingModal from './components/OnboardingModal';
import GuidedMode from './components/GuidedMode';
import DemoMode from './components/DemoMode';

export default function App() {
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [activeTracePath, setActiveTracePath] = useState(null);
  const [activeTraceStep, setActiveTraceStep] = useState(0);
  const [contextualLoading, setContextualLoading] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [codeExpanded, setCodeExpanded] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [guidedStep, setGuidedStep] = useState(null);
  const [repoMapView, setRepoMapView] = useState('architecture');
  const [investigationHistory, setInvestigationHistory] = useState([]);
  const [activeInvestigation, setActiveInvestigation] = useState(null);
  const [lastInvestigationContext, setLastInvestigationContext] = useState(null);
  const [aiState, setAiState] = useState({
    activePrompt: null,
    activeFileExplanation: null,
    typedAnswer: null,
    typedError: null,
  });
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(null);
  const [simulationTask, setSimulationTask] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('repomentor-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('repomentor-theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleLoadSample = useCallback(() => {
    setSampleLoaded(true);
    setSelectedFile(null);
    setSelectedLayer(null);
    setSelectedRelationship(null);
    setActiveTracePath(null);
    setActiveTraceStep(0);
    setSelectedFunction(null);
    setActiveTaskId(null);
    setGuidedStep(null);
    setAiState({ activePrompt: null, activeFileExplanation: null, typedAnswer: null, typedError: null });
    setExpandedFolders(new Set());
    setOnboardingActive(false);
  }, []);

  const handleSelectFile = useCallback((filePath) => {
    setContextualLoading(true);
    setSelectedFile((prev) => {
      if (prev === filePath) return prev;
      return filePath;
    });
    setSelectedRelationship(null);
    setSelectedFunction(null);
    setTimeout(() => setContextualLoading(false), 400);
  }, []);

  const handleSelectLayer = useCallback((layerId) => {
    setSelectedLayer((prev) => (prev === layerId ? prev : layerId));
    setSelectedRelationship(null);
  }, []);

  const handleSelectRelationship = useCallback((relIndex) => {
    setSelectedRelationship((prev) => (prev === relIndex ? null : relIndex));
  }, []);

  const handleSelectFunction = useCallback((funcName) => {
    setSelectedFunction((prev) => (prev === funcName ? null : funcName));
  }, []);

  const handleAiPrompt = useCallback((prompt, fullAnswer) => {
    setAiState((prev) => ({
      ...prev,
      activePrompt: fullAnswer || prompt,
      activeFileExplanation: null,
      typedAnswer: null,
      typedError: null,
    }));
  }, []);

  const handleAiFileExplain = useCallback(() => {
    if (!selectedFile) return;
    setAiState({
      activePrompt: null,
      activeFileExplanation: selectedFile,
      typedAnswer: null,
      typedError: null,
    });
  }, [selectedFile]);

  const handleAiTypedQuestion = useCallback((question) => {
    const trimmed = question.trim();
    if (!trimmed) {
      setAiState((prev) => ({ ...prev, typedAnswer: null, typedError: 'empty' }));
      return;
    }
    const match = pulseboardData.curatedAnswers.find(
      (a) => a.prompt === trimmed
    );
    if (match) {
      setAiState({
        activePrompt: match.prompt,
        activeFileExplanation: null,
        typedAnswer: null,
        typedError: null,
      });
    } else {
      setAiState((prev) => ({ ...prev, typedAnswer: null, typedError: 'unsupported' }));
    }
  }, []);

  const handleExplainCode = useCallback((filePath) => {
    const codeEntry = sourceCode[filePath];
    if (!codeEntry) return;
    const explanation = `**File: ${filePath}**\n\n` +
      `**Exports**\n${(codeEntry.functions || []).map(f => `  - ${f.name}`).join('\n')}\n\n` +
      `**Key functions**\n${(codeEntry.functions || []).slice(0, 3).map(f => `  - ${f.name}: ${f.description}`).join('\n')}\n\n` +
      `This file contains ${codeEntry.functions.length} function${codeEntry.functions.length > 1 ? 's' : ''} and spans ${codeEntry.content.split('\n').length} lines. ` +
      `It is part of the ${pulseboardData.importantFiles.find(f => f.path === filePath)?.connectedLayers?.join(' and ') || ''} architecture layer${pulseboardData.importantFiles.find(f => f.path === filePath)?.connectedLayers?.length > 1 ? 's' : ''}.`;
    setAiState({
      activePrompt: { prompt: `Explain this code: ${filePath.split('/').pop()}`, answer: explanation, references: [filePath], isContextual: true },
      activeFileExplanation: null,
      typedAnswer: null,
      typedError: null,
    });
  }, []);

  const handleExplainFunction = useCallback((filePath, funcName) => {
    const codeEntry = sourceCode[filePath];
    if (!codeEntry) return;
    const func = (codeEntry.functions || []).find(f => f.name === funcName);
    if (!func) return;
    const explanation = `**Function: ${func.name}** in ${filePath.split('/').pop()}\n\n` +
      `**What it does**\n${func.description}\n\n` +
      `**Parameters**\n${func.params}\n\n` +
      `**Return value**\n${func.returns}\n\n` +
      `**Functions it calls**\n${(func.calls && func.calls.length > 0) ? func.calls.map(c => `  - ${c}`).join('\n') : '  None'}\n\n` +
      `**Called by**\n${(func.calledBy && func.calledBy.length > 0) ? func.calledBy.map(c => `  - ${c}`).join('\n') : '  None'}\n\n` +
      `**Side effects**\n${func.sideEffects}\n\n` +
      `**Potential failure points**\n${func.failures}\n\n` +
      `**Beginner explanation**\n${func.beginnerExplanation}`;
    setAiState({
      activePrompt: { prompt: `Explain function: ${funcName}`, answer: explanation, references: [filePath], isContextual: true },
      activeFileExplanation: null,
      typedAnswer: null,
      typedError: null,
    });
  }, []);

  const handleToggleFolder = useCallback((path) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleStartOnboarding = useCallback(() => {
    setOnboardingActive(true);
  }, []);

  const handleCloseOnboarding = useCallback(() => {
    setOnboardingActive(false);
  }, []);

  const handleFirstContributionPath = useCallback((filePath) => {
    setSelectedFile(filePath);
    const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      const parts = folderPath.split('/');
      let acc = '';
      for (const p of parts) {
        if (p) {
          acc += '/' + p;
          next.add(acc);
        }
      }
      return next;
    });
  }, []);

  const handleStartTracePath = useCallback((pathIndex) => {
    setActiveTracePath(pathIndex);
    setActiveTraceStep(0);
    const path = pulseboardData.traceCodePaths[pathIndex];
    if (path && path.steps.length > 0) {
      const firstFile = path.steps[0].file;
      const impFile = pulseboardData.importantFiles.find(f => f.path === firstFile);
      if (impFile) {
        setSelectedFile(firstFile);
      }
    }
  }, []);

  const handleTraceStepChange = useCallback((step) => {
    setActiveTraceStep(step);
    const path = pulseboardData.traceCodePaths[activeTracePath];
    if (path && path.steps[step]) {
      const stepFile = path.steps[step].file;
      const impFile = pulseboardData.importantFiles.find(f => f.path === stepFile);
      if (impFile) {
        setSelectedFile(stepFile);
      }
    }
  }, [activeTracePath]);

  const handleCloseTracePath = useCallback(() => {
    setActiveTracePath(null);
    setActiveTraceStep(0);
  }, []);

  const handleTraceFromHere = useCallback((pathIndex, stepIndex) => {
    setActiveTracePath(pathIndex);
    setActiveTraceStep(stepIndex || 0);
  }, []);

  const handleWhatCouldBreak = useCallback((filePath, funcName) => {
    const wcb = pulseboardData.whatCouldBreak;
    if (!wcb || !wcb[filePath]) {
      setAiState({
        activePrompt: { prompt: 'What could break?', answer: 'No structured impact analysis is available for this file in the curated sample.', references: [], isContextual: true },
        activeFileExplanation: null,
        typedAnswer: null,
        typedError: null,
      });
      return;
    }
    const data = wcb[filePath];
    const funcSuffix = funcName ? ` (specifically the \`${funcName}\` function)` : '';
    const explanation = `**What could break if you modify ${filePath.split('/').pop()}${funcSuffix}?**\n\n` +
      `**Likely affected area**\n${data.affectedArea}\n\n` +
      `**Why it may be affected**\n${data.whyAffected}\n\n` +
      `**Related files**\n${data.relatedFiles.map(f => `  - ${f}`).join('\n')}\n\n` +
      `**Relevant code path**\n${data.codePath}\n\n` +
      `**What a developer should verify**\n${data.developerShouldVerify}\n\n` +
      `**Suggested testing considerations**\n${data.testingConsiderations}`;
    setAiState({
      activePrompt: { prompt: `What could break? (${filePath.split('/').pop()})`, answer: explanation, references: data.relatedFiles, isContextual: true },
      activeFileExplanation: null,
      typedAnswer: null,
      typedError: null,
    });
  }, []);

  const handleTaskSelectFile = useCallback((filePath) => {
    setSelectedFile(filePath);
    const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      const parts = folderPath.split('/');
      let acc = '';
      for (const p of parts) {
        if (p) {
          acc += '/' + p;
          next.add(acc);
        }
      }
      return next;
    });
  }, []);

  const handleTaskSelectFunc = useCallback((funcName) => {
    setSelectedFunction(funcName);
  }, []);

  const handleTaskSelectLayer = useCallback((layerId) => {
    setSelectedLayer(layerId);
  }, []);

  const handleTaskSelect = useCallback((taskId) => {
    setActiveTaskId(taskId);
  }, []);

  const handleStartGuidedMode = useCallback((taskId) => {
    setActiveTaskId(taskId);
    setGuidedStep(0);
    const task = pulseboardData.taskAnalyses.find(t => t.id === taskId);
    if (task && task.steps.length > 0) {
      const firstStep = task.steps[0];
      handleTaskSelectFile(firstStep.file);
      if (firstStep.func) handleTaskSelectFunc(firstStep.func);
      if (firstStep.layer) handleTaskSelectLayer(firstStep.layer);
    }
  }, []);

  const handleGuidedStepChange = useCallback((step) => {
    setGuidedStep(step);
  }, []);

  const handleExitGuidedMode = useCallback(() => {
    setActiveTaskId(null);
    setGuidedStep(null);
  }, []);

  const handleChangeRepoMapView = useCallback((view) => {
    setRepoMapView(view);
  }, []);

  const handleInvestigationQuestion = useCallback((question) => {
    const invData = pulseboardData.investigationData;
    const routing = pulseboardData.investigationRouting;
    const followUps = pulseboardData.investigationFollowUps;
    if (!invData || !routing) return;

    const lower = question.toLowerCase().trim();

    if (lower === 'what happens after' || lower.startsWith('what happens after')) {
      if (lastInvestigationContext && followUps[lastInvestigationContext]) {
        const context = followUps[lastInvestigationContext];
        const answer = context['what happens after'] || 'No follow-up data available for this context.';
        setInvestigationHistory((prev) => [...prev.slice(-9), { question, answer, isFollowUp: true }]);
        setActiveInvestigation(null);
        setLastInvestigationContext(null);
        return;
      }
    }

    if (lower === 'what happens before' || lower.startsWith('what happens before')) {
      if (lastInvestigationContext && followUps[lastInvestigationContext]) {
        const context = followUps[lastInvestigationContext];
        const answer = context['what happens before'] || 'No follow-up data available for this context.';
        setInvestigationHistory((prev) => [...prev.slice(-9), { question, answer, isFollowUp: true }]);
        setActiveInvestigation(null);
        setLastInvestigationContext(null);
        return;
      }
    }

    let matchedKey = null;
    for (const [pattern, key] of Object.entries(routing)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(lower)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey && invData[matchedKey]) {
      const inv = invData[matchedKey];
      setInvestigationHistory((prev) => [...prev.slice(-9), { question, answerKey: matchedKey }]);
      setActiveInvestigation(matchedKey);
      const contextHint = inv.context || 'default';
      const contextFile = matchedKey.includes('file') && selectedFile ? selectedFile.replace('src/', '').split('/')[0] : null;
      setLastInvestigationContext(contextFile || contextHint);
    } else {
      setInvestigationHistory((prev) => [...prev.slice(-9), { question, answer: `I don\'t have a curated answer for that question based on the PulseBoard sample repository. Try one of the investigation suggestions above, or ask about a specific file, flow, or dependency.` }]);
      setActiveInvestigation(null);
    }
  }, [lastInvestigationContext, selectedFile]);

  const handleClearInvestigation = useCallback(() => {
    setInvestigationHistory([]);
    setActiveInvestigation(null);
    setLastInvestigationContext(null);
  }, []);

  const handleStartWalkthrough = useCallback(() => {
    setDemoActive(true);
    setDemoStep(0);
  }, []);

  const handleSimulateChange = useCallback((taskId) => {
    setSimulationTask(taskId);
  }, []);

  const handleExitSimulation = useCallback(() => {
    setSimulationTask(null);
  }, []);

  const handleDemoStepChange = useCallback((step) => {
    setDemoStep(step);
  }, []);

  const handleDemoAction = useCallback((action) => {
    if (!action) return;
    switch (action.type) {
      case 'selectFile':
        handleTaskSelectFile(action.value);
        break;
      case 'startTracePath':
        handleStartTracePath(action.value);
        break;
      case 'setRepoMapView':
        setRepoMapView(action.value);
        break;
      case 'firstContribution':
        handleFirstContributionPath(pulseboardData.firstContribution.relevantPath);
        break;
      default:
        break;
    }
  }, []);

  const handleExitDemo = useCallback(() => {
    setDemoActive(false);
    setDemoStep(null);
  }, []);

  const handleInvestigationAction = useCallback((action) => {
    if (!action) return;
    switch (action.type) {
      case 'selectFile':
        handleTaskSelectFile(action.value);
        break;
      case 'startTracePath':
        handleStartTracePath(action.value);
        break;
      case 'whatCouldBreak':
        handleWhatCouldBreak(selectedFile, selectedFunction);
        break;
      case 'startGuidedMode':
        handleStartGuidedMode(action.value);
        break;
      case 'setRepoMapView':
        setRepoMapView(action.value);
        break;
      case 'selectFunction':
        if (action.value) handleSelectFunction(action.value);
        break;
      case 'clearTask':
        setActiveTaskId(null);
        setGuidedStep(null);
        break;
      case 'viewFileExplanations':
        if (selectedFile) handleAiFileExplain();
        break;
      default:
        break;
    }
  }, [selectedFile, selectedFunction]);

  const getFileContextForLayer = useCallback((filePath) => {
    if (!filePath) return null;
    for (const layer of pulseboardData.architecture.layers) {
      if (layer.associatedFiles.includes(filePath)) {
        return layer.id;
      }
    }
    return null;
  }, []);

  return (
    <div className="app">
      {!sampleLoaded ? (
        <Landing onLoadSample={handleLoadSample} />
      ) : (
        <>
          <PulseBoardWorkspace
            data={pulseboardData}
            sourceCode={sourceCode}
            selectedFile={selectedFile}
            selectedLayer={selectedLayer}
            selectedRelationship={selectedRelationship}
            activeTracePath={activeTracePath}
            activeTraceStep={activeTraceStep}
            contextualLoading={contextualLoading}
            selectedFunction={selectedFunction}
            aiState={aiState}
            expandedFolders={expandedFolders}
            activeTaskId={activeTaskId}
            guidedStep={guidedStep}
            onSelectFile={handleSelectFile}
            onSelectLayer={handleSelectLayer}
            onSelectRelationship={handleSelectRelationship}
            onSelectFunction={handleSelectFunction}
            onAiPrompt={handleAiPrompt}
            onAiFileExplain={handleAiFileExplain}
            onAiTypedQuestion={handleAiTypedQuestion}
            onToggleFolder={handleToggleFolder}
            onStartOnboarding={handleStartOnboarding}
            onFirstContributionPath={handleFirstContributionPath}
            onStartTracePath={handleStartTracePath}
            onTraceStepChange={handleTraceStepChange}
            onCloseTracePath={handleCloseTracePath}
            onTraceFromHere={handleTraceFromHere}
            onExplainCode={handleExplainCode}
            onExplainFunction={handleExplainFunction}
            onWhatCouldBreak={handleWhatCouldBreak}
            onTaskSelectFile={handleTaskSelectFile}
            onTaskSelectFunc={handleTaskSelectFunc}
            onTaskSelectLayer={handleTaskSelectLayer}
            onTaskSelect={handleTaskSelect}
            onStartGuidedMode={handleStartGuidedMode}
            getFileContextForLayer={getFileContextForLayer}
            repoMapView={repoMapView}
            onChangeRepoMapView={handleChangeRepoMapView}
            investigationHistory={investigationHistory}
            activeInvestigation={activeInvestigation}
            investigationData={pulseboardData.investigationData}
            onInvestigationQuestion={handleInvestigationQuestion}
            onClearInvestigation={handleClearInvestigation}
            onInvestigationAction={handleInvestigationAction}
            demoActive={demoActive}
            demoStep={demoStep}
            onStartWalkthrough={handleStartWalkthrough}
            simulationTask={simulationTask}
            onSimulateChange={handleSimulateChange}
            onExitSimulation={handleExitSimulation}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
          {guidedStep !== null && (
            <GuidedMode
              activeTaskId={activeTaskId}
              activeTaskStep={guidedStep}
              taskAnalyses={pulseboardData.taskAnalyses}
              guidedStep={guidedStep}
              onGuidedStepChange={handleGuidedStepChange}
              onSelectTaskFile={handleTaskSelectFile}
              onSelectTaskFunc={handleTaskSelectFunc}
              onSelectTaskLayer={handleTaskSelectLayer}
              onExitGuidedMode={handleExitGuidedMode}
            />
          )}
          {demoActive && demoStep !== null && (
            <DemoMode
              demoStep={demoStep}
              onDemoStepChange={handleDemoStepChange}
              onDemoAction={handleDemoAction}
              onExitDemo={handleExitDemo}
            />
          )}
          {onboardingActive && (
            <OnboardingModal
              steps={pulseboardData.onboardingSteps}
              firstContribution={pulseboardData.firstContribution}
              onClose={handleCloseOnboarding}
              onReviewContribution={() => {
                handleCloseOnboarding();
              }}
              onFirstContributionPath={handleFirstContributionPath}
            />
          )}
        </>
      )}
    </div>
  );
}
