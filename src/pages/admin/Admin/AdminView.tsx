/**
 * AdminView — presentation only (MVVM). Everything comes from useAdmin().
 * Route: /admin/:section? (resumen, loans, proposals, borrowers, lenders, juridical, kpi).
 */
import React from 'react';
import { IonButton, IonContent, IonIcon, IonPage, IonSpinner, IonRefresher, IonRefresherContent } from '@ionic/react';
import { lockClosedOutline, refreshOutline, cloudOfflineOutline } from 'ionicons/icons';
import Header from '../../../components/layout/Header';
import AlertPopover from '../../../components/popovers/AlertPopover';
import MailPopover from '../../../components/popovers/MailPopover';
import { usePopovers } from '../../../hooks/usePopovers';
import EmptyState from '../../../components/ui/EmptyState';
import PageLoading from '../../../components/ui/PageLoading';
import { useAdmin } from './AdminLogic';
import AdminOverview from './components/AdminOverview';
import AdminLoans from './components/AdminLoans';
import AdminProposals from './components/AdminProposals';
import AdminRoster from './components/AdminRoster';
import AdminKpi from './components/AdminKpi';
import AdminClientSheet from './components/AdminClientSheet';

const AdminView: React.FC = () => {
  const vm = useAdmin();
  const pops = usePopovers();

  const body = () => {
    if (!vm.isPlatformAdmin) {
      return <EmptyState icon={lockClosedOutline} text="Esta sección es solo para el administrador de GMO Prestamos." />;
    }
    if (!vm.loaded) {
      return vm.error
        ? (
          <EmptyState
            icon={cloudOfflineOutline}
            text={vm.error}
            action={(
              <IonButton onClick={() => vm.load()} disabled={vm.loading}>
                {vm.loading ? <IonSpinner name="crescent" /> : 'Reintentar'}
              </IonButton>
            )}
          />
        )
        : <PageLoading text="Cargando panel de administración…" />;
    }
    switch (vm.section) {
      case 'loans': return <AdminLoans vm={vm} />;
      case 'proposals': return <AdminProposals vm={vm} />;
      case 'borrowers': return <AdminRoster vm={vm} role="borrower" />;
      case 'lenders': return <AdminRoster vm={vm} role="lender" />;
      case 'juridical': return <AdminRoster vm={vm} role="juridical" />;
      case 'kpi': return <AdminKpi vm={vm} />;
      default: return <AdminOverview vm={vm} />;
    }
  };

  return (
    <IonPage>
      <Header {...pops.headerProps} screenTitle={vm.title} />
      <AlertPopover {...pops.alertPopoverProps} />
      <MailPopover {...pops.mailPopoverProps} />

      <IonContent className="adm-content">
        {vm.isPlatformAdmin && vm.loaded && (
          <IonRefresher slot="fixed" onIonRefresh={e => { vm.load().finally(() => e.detail.complete()); }}>
            <IonRefresherContent />
          </IonRefresher>
        )}
        <div className="adm-body">
          {vm.isPlatformAdmin && vm.loaded && (
            <div className="adm-toolbar">
              <span className="adm-kicker">GMO Prestamos · Administrador</span>
              <IonButton fill="clear" size="small" disabled={vm.loading} onClick={() => vm.load()} aria-label="Actualizar">
                {vm.loading ? <IonSpinner name="dots" /> : <IonIcon icon={refreshOutline} slot="icon-only" />}
              </IonButton>
            </div>
          )}
          {body()}
        </div>
      </IonContent>

      <AdminClientSheet vm={vm} />
    </IonPage>
  );
};

export default AdminView;
