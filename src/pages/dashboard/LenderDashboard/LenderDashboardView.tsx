/**
 * LenderDashboardView — solo presentación (MVVM).
 * Sin fetch, sin lógica de negocio: todo viene de useLenderDashboard().
 */
import React from 'react';
import { IonPage, IonContent, IonLoading, IonToast } from '@ionic/react';
import Header from '../../../components/layout/Header';
import AlertPopover, { PopoverAlert } from '../../../components/popovers/AlertPopover';
import MailPopover from '../../../components/popovers/MailPopover';
import { usePopovers } from '../../../hooks/usePopovers';
import { useLenderDashboard } from './LenderDashboardLogic';
import GreetingEarnings from './components/GreetingEarnings';
import PortfolioHero from './components/PortfolioHero';
import KpiCards from './components/KpiCards';
import VerificationCard from './components/VerificationCard';
import LenderSetupCard from './components/LenderSetupCard';
import PaymentsCard from './components/PaymentsCard';
import PerformanceGauge from './components/PerformanceGauge';
import LoansList from './components/LoansList';
import StatusSummary from './components/StatusSummary';
import RecentActivityCard from './components/RecentActivityCard';

const LenderDashboardView: React.FC = () => {
  const vm = useLenderDashboard();
  // Shared Header (menu + notifications + mail + help) — same component and
  // wiring the borrower dashboard uses, so both roles get the same top bar.
  const pops = usePopovers();
  // Unfinished "Primeros pasos" also go to the header's Alertas popover (badge
  // on its icon), so they stay visible after scrolling past the setup card.
  const setupAlerts: PopoverAlert[] = vm.setupLoaded
    ? vm.setupSteps.filter(s => !s.done).map(s => ({
        id: s.id, title: s.label, detail: s.detail, onSelect: s.action,
      }))
    : [];

  return (
    <IonPage>
      <Header
        {...pops.headerProps}
        screenTitle="Portfolio — Prestamista"
        alertCount={setupAlerts.length}
      />
      <AlertPopover {...pops.alertPopoverProps} alerts={setupAlerts} />
      <MailPopover {...pops.mailPopoverProps} />

      <IonContent className="lender-dashboard-content ion-padding">
        <IonLoading isOpen={vm.loading} message="Cargando portfolio..." />
        <IonToast isOpen={!!vm.error} message={vm.error} duration={3000} onDidDismiss={() => vm.setError('')} color="danger" />
        <IonToast
          isOpen={vm.slowLoad}
          message="La carga está tardando más de lo normal — seguimos obteniendo tus datos…"
          duration={4000}
          position="bottom"
          color="warning"
          onDidDismiss={() => vm.setSlowLoad(false)}
        />

        <GreetingEarnings vm={vm} />
        {/* New lenders: the 3 steps before lending, with % done (hidden once complete). */}
        <LenderSetupCard vm={vm} />
        <PortfolioHero vm={vm} />
        <KpiCards vm={vm} />
        <VerificationCard vm={vm} />
        <PaymentsCard vm={vm} />
        <PerformanceGauge vm={vm} />
        <LoansList vm={vm} />
        <StatusSummary vm={vm} />
        <RecentActivityCard vm={vm} />
      </IonContent>
    </IonPage>
  );
};

export default LenderDashboardView;
