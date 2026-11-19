import React from 'react';
import { IonBadge, IonItem, IonLabel, IonList, IonNote } from '@ionic/react';
import { mailOpenOutline } from 'ionicons/icons';
import EmptyState from '../../../../components/ui/EmptyState';
import { PROPOSAL_STATUS } from '../../../../components/ui/statusMaps';
import { fmtMXN, mxDate } from '../../../../utils/format';
import type { AdminVM } from '../AdminLogic';

const COLOR: Record<string, string> = {
  pending: 'warning', countered: 'tertiary', accepted: 'success', rejected: 'danger', expired: 'medium', cancelled: 'medium',
};

/** /admin/proposals — the P2P marketplace requests (read-only: lenders decide them). */
const AdminProposals: React.FC<{ vm: AdminVM }> = ({ vm }) => (
  <>
    <h3 className="adm-section-title">
      {vm.kpis.proposalsPending} pendientes · {vm.kpis.offersActive} ofertas activas ({fmtMXN(vm.kpis.publishedCapital)})
    </h3>
    {vm.proposals.length === 0 ? (
      <EmptyState icon={mailOpenOutline} text="Aún no hay solicitudes en el marketplace." />
    ) : (
      <IonList lines="full" className="adm-list">
        {vm.proposals.map(p => {
          const amount = p.counteredAmount ?? p.requestedAmount;
          const rate = p.counteredRate ?? p.proposedRate;
          const term = p.counteredTermMonths ?? p.termMonths;
          return (
            <IonItem key={p.proposalId}>
              <IonLabel>
                <h2>{fmtMXN(Number(amount || 0))} · {rate}% · {term} m</h2>
                <p>Acreditado: {vm.clientName(p.borrowerId)}</p>
                <p>Prestamista: {vm.clientName(p.lenderId)}</p>
                <p className="adm-muted">Solicitud #{p.proposalId} · {mxDate(p.created_At)}</p>
              </IonLabel>
              <IonNote slot="end">
                <IonBadge color={COLOR[p.status] ?? 'medium'}>
                  {p.status === 'countered' ? 'Contraoferta' : PROPOSAL_STATUS[p.status]?.label ?? p.status}
                </IonBadge>
              </IonNote>
            </IonItem>
          );
        })}
      </IonList>
    )}
  </>
);

export default AdminProposals;
