import React from 'react';
import { IonButton, IonItem, IonLabel, IonList, IonNote, IonSearchbar, IonSegment, IonSegmentButton } from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import EmptyState from '../../../../components/ui/EmptyState';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { LOAN_STATUS } from '../../../../components/ui/statusMaps';
import { fmtMXN, mxDate } from '../../../../utils/format';
import type { AdminVM, LoanFilter } from '../AdminLogic';

const FILTERS: { id: LoanFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'open', label: 'Vigentes' },
  { id: 'late', label: 'En mora' },
  { id: 'pipeline', label: 'Por fondear' },
  { id: 'settled', label: 'Liquidados' },
];

/** /admin/loans — every loan of the company, with borrower and lender. Tap → loan detail. */
const AdminLoans: React.FC<{ vm: AdminVM }> = ({ vm }) => {
  const history = useHistory();
  return (
    <>
      <div className="adm-section-head">
        <h3 className="adm-section-title">{vm.visibleLoans.length} de {vm.loans.length} préstamos</h3>
        <IonButton size="small" fill="outline" onClick={() => history.push('/admin/proposals')}>Solicitudes</IonButton>
      </div>
      <IonSearchbar
        value={vm.loanSearch}
        onIonInput={e => vm.setLoanSearch(e.detail.value ?? '')}
        placeholder="Folio, acreditado o prestamista"
        className="adm-search"
      />
      <IonSegment
        scrollable
        value={vm.loanFilter}
        onIonChange={e => vm.setLoanFilter((e.detail.value as LoanFilter) ?? 'all')}
        className="adm-segment"
      >
        {FILTERS.map(f => (
          <IonSegmentButton key={f.id} value={f.id}><IonLabel>{f.label}</IonLabel></IonSegmentButton>
        ))}
      </IonSegment>

      {vm.visibleLoans.length === 0 ? (
        <EmptyState icon={documentTextOutline} text="No hay préstamos con este filtro." />
      ) : (
        <IonList lines="full" className="adm-list">
          {vm.visibleLoans.map(l => (
            <IonItem key={l.loanId} button detail onClick={() => history.push(`/loan-detail/${l.loanId}`)}>
              <IonLabel>
                <h2>{fmtMXN(Number(l.approvedAmount ?? l.principalAmount ?? 0))} · {l.interestRate}% · {l.termMonths} m</h2>
                <p>Acreditado: {vm.clientName(l.clientId)}</p>
                <p>Prestamista: {vm.clientName(vm.lenderOf(l))}</p>
                <p className="adm-muted">{l.loanNumber || `#${l.loanId}`} · {mxDate(l.disbursementDate ?? l.created_At)}</p>
              </IonLabel>
              <IonNote slot="end"><StatusBadge status={l.loanStatus} map={LOAN_STATUS} /></IonNote>
            </IonItem>
          ))}
        </IonList>
      )}
    </>
  );
};

export default AdminLoans;
