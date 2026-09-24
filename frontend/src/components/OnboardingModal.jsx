import React, { useState } from 'react';

export default function OnboardingModal({
  steps,
  firstContribution,
  onClose,
  onFirstContributionPath,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === steps.length - 1;
  const isCompleted = currentStep >= steps.length;

  const handleNext = () => {
    if (isLastStep) {
      setCurrentStep(steps.length);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Onboarding">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <h2 className="onboarding-title">Welcome to PulseBoard</h2>
          <button className="onboarding-close" onClick={onClose} aria-label="Close onboarding">
            {'\u2715'}
          </button>
        </div>

        {!isCompleted && (
          <>
            <div className="onboarding-steps-indicator">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`onboarding-dot ${i === currentStep ? 'onboarding-dot-active' : ''} ${i < currentStep ? 'onboarding-dot-done' : ''}`}
                />
              ))}
            </div>

            <div className="onboarding-step">
              <h3 className="onboarding-step-title">
                Step {currentStep + 1}: {steps[currentStep].title}
              </h3>
              <p className="onboarding-step-content">{steps[currentStep].content}</p>
            </div>

            <div className="onboarding-footer">
              <button className="onboarding-next" onClick={handleNext}>
                {isLastStep ? 'Complete' : 'Next'}
              </button>
            </div>
          </>
        )}

        {isCompleted && (
          <div className="onboarding-completed">
            <p className="onboarding-completed-icon">{'\u2713'}</p>
            <h3>Onboarding Complete</h3>
            <p>
              You now have a solid understanding of PulseBoard's purpose, structure,
              architecture, and key files.
            </p>
            <button
              className="onboarding-review-btn"
              onClick={() => {
                onFirstContributionPath(firstContribution.relevantPath);
                onClose();
              }}
            >
              Review Your First Contribution
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="onboarding-footer">
            <button className="onboarding-restart" onClick={handleRestart}>
              Restart Onboarding
            </button>
          </div>
        )}

        {!isCompleted && (
          <div className="onboarding-footer-secondary">
            <button className="onboarding-restart" onClick={handleRestart}>
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
