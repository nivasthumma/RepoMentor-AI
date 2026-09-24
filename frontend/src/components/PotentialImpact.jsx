import React from 'react';

export default function PotentialImpact({
  functionData,
  sourceCodeEntry,
  selectedFile,
  importantFiles,
}) {
  if (!functionData || !sourceCodeEntry) return null;

  const functions = sourceCodeEntry.functions || [];
  const func = functions.find(f => f.name === functionData);
  if (!func) return null;

  const fileInfo = importantFiles.find(f => f.path === selectedFile);

  const impactAreas = [];

  impactAreas.push({
    area: 'Direct callers',
    level: 'high',
    description: func.calledBy && func.calledBy.length > 0
      ? `${func.calledBy.join(', ')} call this function directly. Any signature change or behaviour modification will require updates in these callers.`
      : 'This function is not directly called by other code in the sample. Changes are isolated.',
  });

  impactAreas.push({
    area: 'Downstream consumers',
    level: func.calls && func.calls.length > 0 ? 'high' : 'low',
    description: func.calls && func.calls.length > 0
      ? `This function calls ${func.calls.join(', ')}. If you change the output format or behaviour, these downstream consumers may produce unexpected results.`
      : 'This function does not call any other functions — changes have minimal downstream impact.',
  });

  if (fileInfo) {
    impactAreas.push({
      area: 'Architecture layer',
      level: 'medium',
      description: `${selectedFile} belongs to ${fileInfo.connectedLayers.join(' and ')} layers. Changes may affect other components sharing these layers.`,
    });

    if (fileInfo.directDependencies && fileInfo.directDependencies.length > 0) {
      impactAreas.push({
        area: 'Direct dependencies',
        level: 'medium',
        description: `This file depends on ${fileInfo.directDependencies.join(', ')}. Updates to function signatures may require changes in these dependency contracts.`,
      });
    }

    if (fileInfo.relatedFiles && fileInfo.relatedFiles.length > 0) {
      impactAreas.push({
        area: 'Related files',
        level: 'low',
        description: `Related files (${fileInfo.relatedFiles.join(', ')}) use similar patterns or share interfaces. Changes may need alignment for consistency.`,
      });
    }
  }

  impactAreas.push({
    area: 'Tests',
    level: func.calls && func.calls.length > 0 ? 'medium' : 'low',
    description: `Test files for this area (${selectedFile.replace('.ts', '.test.ts')}) may need updating if the function signature or behaviour changes.`,
  });

  return (
    <section className="workspace-section potential-impact">
      <h2 className="section-title">Potential Impact</h2>
      <div className="potential-impact-content">
        <p className="potential-impact-intro">
          Changing <strong>{func.name}</strong> in <strong>{selectedFile.split('/').pop()}</strong> could affect:
        </p>
        <div className="potential-impact-list">
          {impactAreas.map((area, i) => (
            <div key={i} className={`potential-impact-item potential-impact-${area.level}`}>
              <div className="potential-impact-header">
                <span className={`potential-impact-badge potential-impact-badge-${area.level}`}>
                  {area.level === 'high' ? 'High' : area.level === 'medium' ? 'Medium' : 'Low'}
                </span>
                <span className="potential-impact-area">{area.area}</span>
              </div>
              <p className="potential-impact-desc">{area.description}</p>
            </div>
          ))}
        </div>
        <p className="potential-impact-note">
          This impact analysis is based on the curated sample data and describes plausible relationships
          in the PulseBoard codebase. Actual impact would require a full static-analysis tool.
        </p>
      </div>
    </section>
  );
}