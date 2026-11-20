import React from 'react';
import { IonButton, IonCard, IonCardContent, IonIcon, IonProgressBar, IonSpinner } from '@ionic/react';
import { checkmarkCircle, ellipseOutline, chevronForwardOutline } from 'ionicons/icons';
import './SetupStepsCard.css';

export interface SetupStep {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  /** 0–1 partial credit for a step already started (e.g. 4 of 6 KYC pieces). */
  progress?: number;
  cta: string;
  action: () => void;
}

/** Done count, completion (with partial credit) and the next step to do. */
export function summarizeSetup(steps: SetupStep[]) {
  const done = steps.filter(s => s.done).length;
  const progress = steps.length
    ? steps.reduce((sum, s) => sum + (s.done ? 1 : s.progress ?? 0), 0) / steps.length
    : 0;
  return { done, progress, pct: Math.round(progress * 100), nextId: steps.find(s => !s.done)?.id ?? null };
}

interface Props {
  /** False until every source the steps read has loaded — never a "0%" before the data is in. */
  loaded: boolean;
  steps: SetupStep[];
  /** Completes "N de M completados …", e.g. "para empezar a prestar". */
  goal: string;
  /** Step whose action is in flight: its button shows a spinner and is disabled. */
  busyStepId?: string | null;
  className?: string;
}

/**
 * Primeros pasos — the ordered things a new client must finish before using
 * their product (lender and borrower dashboards). Shows the completion % with
 * partial credit for a step in progress, and hides itself once all are done.
 */
const SetupStepsCard: React.FC<Props> = ({ loaded, steps, goal, busyStepId, className }) => {
  const { done, progress, pct, nextId } = summarizeSetup(steps);
  if (loaded && done === steps.length) return null;

  return (
    <IonCard className={`setup${className ? ` ${className}` : ''}`}>
      <IonCardContent>
        {!loaded ? (
          <div className="setup-loading">
            <IonSpinner name="dots" />
            <span>Revisando tu configuración…</span>
          </div>
        ) : (
          <>
            <div className="setup-head">
              <div>
                <h2 className="setup-title">Primeros pasos</h2>
                <p className="setup-sub">{done} de {steps.length} completados {goal}</p>
              </div>
              <div className="setup-pct" aria-label={`${pct}% completado`}>{pct}%</div>
            </div>
            <IonProgressBar className="setup-bar" value={progress} />

            <ol className="setup-steps">
              {steps.map((step, i) => {
                const isNext = step.id === nextId;
                const busy = step.id === busyStepId;
                return (
                  <li
                    key={step.id}
                    className={`setup-step${step.done ? ' setup-step--done' : ''}${isNext ? ' setup-step--next' : ''}`}
                  >
                    <IonIcon
                      className="setup-step-icon"
                      icon={step.done ? checkmarkCircle : ellipseOutline}
                      aria-hidden="true"
                    />
                    <div className="setup-step-text">
                      <strong>{i + 1}. {step.label}</strong>
                      <span>{step.detail}</span>
                      {/* A step already started shows how far along it is (e.g. 4 de 6 = 67%). */}
                      {!step.done && (step.progress ?? 0) > 0 && (
                        <div className="setup-step-progress">
                          <IonProgressBar className="setup-step-bar" value={step.progress} />
                          <span>{Math.round((step.progress ?? 0) * 100)}%</span>
                        </div>
                      )}
                    </div>
                    {!step.done && (
                      <IonButton
                        size="small"
                        fill={isNext ? 'solid' : 'outline'}
                        className="setup-step-btn"
                        disabled={busy}
                        onClick={step.action}
                      >
                        {busy ? <IonSpinner name="dots" /> : (
                          <>
                            {step.cta}
                            <IonIcon icon={chevronForwardOutline} slot="end" />
                          </>
                        )}
                      </IonButton>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default SetupStepsCard;
