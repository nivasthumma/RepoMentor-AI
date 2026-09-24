import React from 'react';

export default function FirstContribution({ data, onPathClick, onStartExploring }) {
  if (!data) return null;

  return (
    <section className="workspace-section first-contribution">
      <h2 className="section-title">Your First Contribution</h2>
      <div className="first-contribution-content">
        <h3 className="fc-area">{data.areaName}</h3>
        <p className="fc-rationale">{data.rationale}</p>

        {data.whyGoodFirstContribution && (
          <div className="fc-why">
            <strong>Why this is a good first contribution:</strong>
            <p>{data.whyGoodFirstContribution}</p>
          </div>
        )}

        {data.difficulty && (
          <div className="fc-difficulty">
            <span className="section-title">Difficulty</span>
            <span className={`fc-difficulty-badge fc-difficulty-${data.difficulty.toLowerCase()}`}>
              {data.difficulty}
            </span>
          </div>
        )}

        {data.prerequisites && data.prerequisites.length > 0 && (
          <div className="fc-prerequisites">
            <span className="section-title">Prerequisites</span>
            <ul className="fc-prereq-list">
              {data.prerequisites.map((prereq, i) => (
                <li key={i}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="fc-path">
          <strong>Relevant file: </strong>
          <button
            className="fc-path-link"
            onClick={() => onPathClick(data.relevantPath)}
            aria-label={`Select file ${data.relevantPath} in structure explorer`}
          >
            {data.relevantPath}
          </button>
        </p>
        <p className="fc-action">
          <strong>First action: </strong>
          {data.firstAction}
        </p>

        <button
          className="fc-start-btn"
          onClick={() => onStartExploring(data.relevantPath)}
        >
          Start exploring
        </button>
      </div>
    </section>
  );
}