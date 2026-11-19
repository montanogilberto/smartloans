import React from 'react';
import { IonButton, IonCard, IonCardContent, IonIcon, IonProgressBar, IonSpinner } from '@ionic/react';
import { checkmarkCircle, ellipseOutline, chevronForwardOutline } from 'ionicons/icons';
import { LenderDashboardVM } from '../LenderDashboardLogic';

/**
 * Primeros pasos — the 3 things a new lender must finish before lending:
 * verify identity, register the payout CLABE, publish capital. Shows the
 * completion % — with partial credit for a step in progress — and hides itself once all three are done.
 * Waits for the first load: never a "0%" before the data is in.
 */
const LenderSetupCard: React.FC<{ vm: LenderDashboardVM }> = ({ vm }) => {
  if (vm.setupLoaded && vm.setupDone === vm.setupSteps.length) return null;

  return (
    <IonCard className="ld-card ld-setup">
      <IonCardContent>
        {!vm.setupLoaded ? (
          <div className="ld-setup-loading">
            <IonSpinner name="dots" />
            <span>Revisando tu configuración…</span>
          </div>
        ) : (
          <>
            <div className="ld-setup-head">
              <div>
                <h2 className="ld-setup-title">Primeros pasos</h2>
                <p className="ld-setup-sub">
                  {vm.setupDone} de {vm.setupSteps.length} completados para empezar a prestar
                </p>
              </div>
              <div className="ld-setup-pct" aria-label={`${vm.setupPct}% completado`}>
                {vm.setupPct}%
              </div>
            </div>
            <IonProgressBar className="ld-setup-bar" value={vm.setupProgress} />

            <ol className="ld-setup-steps">
              {vm.setupSteps.map((step, i) => {
                const isNext = step.id === vm.setupNextId;
                return (
                  <li
                    key={step.id}
                    className={`ld-setup-step${step.done ? ' ld-setup-step--done' : ''}${isNext ? ' ld-setup-step--next' : ''}`}
                  >
                    <IonIcon
                      className="ld-setup-step-icon"
                      icon={step.done ? checkmarkCircle : ellipseOutline}
                      aria-hidden="true"
                    />
                    <div className="ld-setup-step-text">
                      <strong>{i + 1}. {step.label}</strong>
                      <span>{step.detail}</span>
                      {/* A step already started shows how far along it is (e.g. 4 de 6 = 67%). */}
                      {!step.done && 'progress' in step && (step.progress ?? 0) > 0 && (
                        <div className="ld-setup-step-progress">
                          <IonProgressBar className="ld-setup-step-bar" value={step.progress} />
                          <span>{Math.round((step.progress ?? 0) * 100)}%</span>
                        </div>
                      )}
                    </div>
                    {!step.done && (
                      <IonButton
                        size="small"
                        fill={isNext ? 'solid' : 'outline'}
                        className="ld-setup-step-btn"
                        disabled={step.id === 'identity' && vm.wizardStarting}
                        onClick={step.action}
                      >
                        {step.id === 'identity' && vm.wizardStarting ? <IonSpinner name="dots" /> : (
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

export default LenderSetupCard;
