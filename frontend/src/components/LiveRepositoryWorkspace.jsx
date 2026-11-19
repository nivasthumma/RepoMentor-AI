import React, { useMemo, useState } from 'react';
import { answerRepositoryQuestion, getFileAnalysis } from '../services/repositoryAnalysis.js';
import './LiveRepositoryWorkspace.css';

function FileTree({ nodes, selectedPath, onSelect, prefix = '' }) {
  return <ul className="live-tree">{nodes.map((node) => {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    return <li key={path}>{node.type === 'directory'
      ? <details open><summary>{node.name}/</summary><FileTree nodes={node.children} prefix={path} selectedPath={selectedPath} onSelect={onSelect} /></details>
      : <button className={selectedPath === path ? 'live-file selected' : 'live-file'} onClick={() => onSelect(path)}>{node.name}</button>}</li>;
  })}</ul>;
}

export default function LiveRepositoryWorkspace({ repository, onBack }) {
  const [selectedPath, setSelectedPath] = useState(repository.files[0]?.path || '');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [query, setQuery] = useState('');
  const visibleFiles = useMemo(() => repository.files.filter((file) => file.path.toLowerCase().includes(query.toLowerCase())), [repository.files, query]);
  const selectedFile = repository.files.find((file) => file.path === selectedPath);
  const fileAnalysis = selectedFile ? getFileAnalysis(selectedFile, repository.files) : null;

  function ask(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setAnswer(answerRepositoryQuestion(question.trim(), repository.files));
  }

  return <main className="live-workspace">
    <header className="live-header"><div><button onClick={onBack} className="live-back">← Back</button><h1>{repository.fullName}</h1><p>{repository.description || 'No repository description'} · {repository.defaultBranch} · Public repository</p></div><a href={repository.htmlUrl} target="_blank" rel="noreferrer">View on GitHub ↗</a></header>
    <div className="live-notice"><strong>Repository-grounded analysis (preview)</strong><span>Answers are generated from public source files indexed in this browser—not from an LLM. No credentials are stored or sent.</span></div>
    <section className="live-stats" aria-label="Repository summary"><div><strong>{repository.files.length}</strong><span>Indexed source files</span></div><div><strong>{repository.languages.length || '—'}</strong><span>File types</span></div><div><strong>{repository.dependencies.length}</strong><span>Package manifests</span></div></section>
    <div className="live-grid">
      <aside className="live-panel"><h2>Repository files</h2><input aria-label="Filter files" placeholder="Filter by path…" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="live-file-list">{visibleFiles.length ? visibleFiles.map((file) => <button key={file.path} className={selectedPath === file.path ? 'live-file selected' : 'live-file'} onClick={() => setSelectedPath(file.path)}>{file.path}</button>) : <p>No indexed files match.</p>}</div></aside>
      <section className="live-panel live-source"><h2>{selectedPath || 'Select a file'}</h2>{selectedFile ? <><div className="live-file-meta">{fileAnalysis.language} · {selectedFile.content.split('\n').length} lines · {fileAnalysis.imports.length} imports</div><pre><code>{selectedFile.content.split('\n').map((line, index) => <span className="live-code-line" id={`line-${index + 1}`} key={index}><a href={`#line-${index + 1}`} aria-label={`Line ${index + 1}`}>{index + 1}</a>{line || ' '}{'\n'}</span>)}</code></pre></> : <p>No source files were indexed.</p>}</section>
      <aside className="live-panel"><h2>File insights</h2>{fileAnalysis && <><p><strong>Detected language:</strong> {fileAnalysis.language}</p><p><strong>Imports / references:</strong></p>{fileAnalysis.imports.length ? <ul>{fileAnalysis.imports.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No import references detected by the lightweight scanner.</p>}<p><strong>Declared symbols:</strong> {fileAnalysis.symbols.length ? fileAnalysis.symbols.join(', ') : 'None detected'}</p><p className="live-caveat">Static pattern scan only; this does not resolve symbols or prove runtime behavior.</p></>}</aside>
    </div>
    <section className="live-panel live-ask"><h2>Ask about indexed code</h2><form onSubmit={ask}><input aria-label="Question about repository" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="e.g. Where is authentication handled?" /><button type="submit">Analyze</button></form>{answer && <div className="live-answer" aria-live="polite"><p>{answer.text}</p>{answer.evidence.length > 0 && <><h3>Evidence</h3><ul>{answer.evidence.map((item) => <li key={item.path}><button onClick={() => { setSelectedPath(item.path); document.getElementById('live-source')?.scrollIntoView({ behavior: 'smooth' }); }}>{item.path}{item.lines.length ? ` · lines ${item.lines.join(', ')}` : ''}</button></li>)}</ul></>}</div>}</section>
    {repository.truncated && <p className="live-caveat">Indexing was capped for safety and speed. Some source files may be omitted.</p>}
  </main>;
}
