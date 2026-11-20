import React from 'react';
import SetupStepsCard from '../../../../components/ui/SetupStepsCard';
import { LenderDashboardVM } from '../LenderDashboardLogic';

/**
 * Primeros pasos — the 3 things a new lender must finish before lending:
 * verify identity, register the payout CLABE, publish capital.
 */
const LenderSetupCard: React.FC<{ vm: LenderDashboardVM }> = ({ vm }) => (
  <SetupStepsCard
    className="ld-card"
    loaded={vm.setupLoaded}
    steps={vm.setupSteps}
    goal="para empezar a prestar"
    busyStepId={vm.wizardStarting ? 'identity' : null}
  />
);

export default LenderSetupCard;
