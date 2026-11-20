import React from 'react';
import { IonBadge, IonItem, IonLabel, IonList, IonNote, IonSearchbar } from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import EmptyState from '../../../../components/ui/EmptyState';
import { fmtMXN } from '../../../../utils/format';
import type { AdminRole } from '../adminMetrics';
import type { AdminVM } from '../AdminLogic';

const EMPTY: Record<AdminRole, string> = {
  borrower: 'No hay acreditados registrados.',
  lender: 'No hay prestamistas registrados.',
  juridical: 'No hay asesores jurídicos registrados.',
};

/** /admin/borrowers · /admin/lenders · /admin/juridical — members of one product. Tap → client sheet. */
const AdminRoster: React.FC<{ vm: AdminVM; role: AdminRole }> = ({ vm, role }) => {
  const members = vm.membersOf(role);
  return (
    <>
      <IonSearchbar
        value={vm.clientSearch}
        onIonInput={e => vm.setClientSearch(e.detail.value ?? '')}
        placeholder="Nombre, teléfono o correo"
        className="adm-search"
      />
      <h3 className="adm-section-title">{members.length} {members.length === 1 ? 'registro' : 'registros'}</h3>
      {members.length === 0 ? (
        <EmptyState icon={peopleOutline} text={vm.clientSearch ? 'Sin resultados para esa búsqueda.' : EMPTY[role]} />
      ) : (
        <IonList lines="full" className="adm-list">
          {members.map(({ client }) => {
            const s = vm.statsFor(client.clientId);
            const line = role === 'borrower'
              ? `${s.borrowedCount} préstamos · ${fmtMXN(s.borrowedAmount)} recibidos`
              : role === 'lender'
                ? `${s.lentCount} préstamos · ${fmtMXN(s.lentAmount)} colocados · ${fmtMXN(s.offeredCapital)} publicados`
                : client.email || client.cellphone || '—';
            const late = role === 'borrower' ? s.borrowerLate : role === 'lender' ? s.lenderLate : 0;
            return (
              <IonItem key={client.clientId} button detail onClick={() => vm.openClient(client.clientId)}>
                <IonLabel>
                  <h2>{`${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || `Cliente #${client.clientId}`}</h2>
                  <p>{line}</p>
                  {client.cellphone && <p className="adm-muted">{client.cellphone}</p>}
                </IonLabel>
                <IonNote slot="end" className="adm-badges">
                  {client.isActive === false && <IonBadge color="medium">Inactivo</IonBadge>}
                  {late > 0 && <IonBadge color="danger">{late} en mora</IonBadge>}
                </IonNote>
              </IonItem>
            );
          })}
        </IonList>
      )}
    </>
  );
};

export default AdminRoster;
