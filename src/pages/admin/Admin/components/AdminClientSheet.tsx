import React from 'react';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
  IonModal, IonSpinner, IonTitle, IonToggle, IonToolbar, useIonAlert, useIonToast,
} from '@ionic/react';
import { close, folderOpenOutline, openOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { fmtMXN } from '../../../../utils/format';
import { AdminRole, ROLE_CAPABILITY } from '../adminMetrics';
import type { AdminVM } from '../AdminLogic';

const ROLE_LABEL: Record<AdminRole, string> = {
  borrower: 'Acreditado',
  lender: 'Prestamista',
  juridical: 'Jurídico',
};

const ROLES: AdminRole[] = ['borrower', 'lender', 'juridical'];

/** The client sheet: who they are, their numbers, and the admin actions on them. */
const AdminClientSheet: React.FC<{ vm: AdminVM }> = ({ vm }) => {
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();
  const c = vm.selectedClient;

  const report = (error: string | null, ok: string) => {
    presentToast({ message: error ? `No se pudo completar: ${error}` : ok, color: error ? 'danger' : 'success', duration: 2500, position: 'top' });
  };

  const confirmRole = (role: AdminRole, enabled: boolean) => {
    if (!c) return;
    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
    presentAlert({
      header: enabled ? `Activar perfil ${ROLE_LABEL[role]}` : `Quitar perfil ${ROLE_LABEL[role]}`,
      message: enabled
        ? `${name} podrá usar GMO Prestamos como ${ROLE_LABEL[role].toLowerCase()}.`
        : `${name} dejará de ver el panel de ${ROLE_LABEL[role].toLowerCase()}. Sus préstamos existentes no cambian.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: enabled ? 'Activar' : 'Quitar',
          role: enabled ? 'confirm' : 'destructive',
          handler: () => {
            vm.setRole(c.clientId, role, enabled).then(err =>
              report(err, enabled ? 'Perfil activado' : 'Perfil retirado'));
          },
        },
      ],
    });
  };

  const confirmActive = (active: boolean) => {
    if (!c) return;
    presentAlert({
      header: active ? 'Reactivar cuenta' : 'Desactivar cuenta',
      message: active
        ? 'La cuenta podrá volver a iniciar sesión y operar.'
        : 'La cuenta quedará inactiva. Sus préstamos y pagos pendientes siguen vigentes.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: active ? 'Reactivar' : 'Desactivar',
          role: active ? 'confirm' : 'destructive',
          handler: () => {
            vm.setActive(c.clientId, active).then(err =>
              report(err, active ? 'Cuenta reactivada' : 'Cuenta desactivada'));
          },
        },
      ],
    });
  };

  const go = (to: string) => {
    vm.closeClient();
    history.push(to);
  };

  const s = c ? vm.statsFor(c.clientId) : null;
  const inactive = c?.isActive === false;

  return (
    <IonModal isOpen={!!c} onDidDismiss={vm.closeClient}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || `Cliente #${c.clientId}` : ''}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={vm.closeClient} aria-label="Cerrar"><IonIcon icon={close} slot="icon-only" /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="adm-sheet">
        {c && s && (
          <>
            <IonList lines="full">
              <IonItem>
                <IonLabel>
                  <p>Teléfono</p>
                  <h2>{c.cellphone || '—'}</h2>
                </IonLabel>
                {inactive ? <IonBadge slot="end" color="medium">Inactiva</IonBadge> : <IonBadge slot="end" color="success">Activa</IonBadge>}
              </IonItem>
              <IonItem><IonLabel><p>Correo</p><h2>{c.email || '—'}</h2></IonLabel></IonItem>
              <IonItem><IonLabel><p>Cliente</p><h2>#{c.clientId}</h2></IonLabel></IonItem>
            </IonList>

            <IonListHeader>Actividad</IonListHeader>
            <div className="adm-sheet-stats">
              <span>Como acreditado: <strong>{s.borrowedCount}</strong> préstamos · {fmtMXN(s.borrowedAmount)}{s.borrowerLate ? ` · ${s.borrowerLate} en mora` : ''}</span>
              <span>Como prestamista: <strong>{s.lentCount}</strong> préstamos · {fmtMXN(s.lentAmount)}{s.lenderLate ? ` · ${s.lenderLate} en mora` : ''}</span>
              <span>Capital publicado: {fmtMXN(s.offeredCapital)}</span>
            </div>

            <IonListHeader>Perfiles en GMO Prestamos</IonListHeader>
            <IonList lines="full">
              {ROLES.map(role => {
                const held = vm.selectedHeld.has(ROLE_CAPABILITY[role]);
                // Granted only by the legacy clientType: shown, but there is no capability row to revoke.
                const legacyOnly = !held && vm.selectedRoles.includes(role);
                const busy = vm.busy === `${c.clientId}:${role}`;
                return (
                  <IonItem key={role}>
                    <IonLabel>
                      <h2>{ROLE_LABEL[role]}</h2>
                      {legacyOnly && <p>Asignado por tipo de cliente</p>}
                    </IonLabel>
                    {busy ? (
                      <IonSpinner slot="end" name="crescent" />
                    ) : (
                      <IonToggle
                        slot="end"
                        checked={held || legacyOnly}
                        disabled={!!vm.busy || legacyOnly}
                        onIonChange={e => {
                          const next = e.detail.checked;
                          // Snap back until the admin confirms; the reload sets the real value.
                          (e.target as HTMLIonToggleElement).checked = held || legacyOnly;
                          confirmRole(role, next);
                        }}
                        aria-label={`Perfil ${ROLE_LABEL[role]}`}
                      />
                    )}
                  </IonItem>
                );
              })}
            </IonList>

            <IonListHeader>Ver</IonListHeader>
            <IonList lines="full">
              {vm.selectedRoles.includes('borrower') && (
                <IonItem button detail onClick={() => go(`/client-dashboard/${c.clientId}`)}>
                  <IonIcon icon={openOutline} slot="start" /><IonLabel>Panel del acreditado</IonLabel>
                </IonItem>
              )}
              {vm.selectedRoles.includes('lender') && (
                <IonItem button detail onClick={() => go(`/lender-dashboard/${c.clientId}`)}>
                  <IonIcon icon={openOutline} slot="start" /><IonLabel>Panel del prestamista</IonLabel>
                </IonItem>
              )}
              {vm.selectedRoles.includes('juridical') && (
                <IonItem button detail onClick={() => go(`/juridical-dashboard/${c.clientId}`)}>
                  <IonIcon icon={openOutline} slot="start" /><IonLabel>Panel jurídico</IonLabel>
                </IonItem>
              )}
              <IonItem button detail onClick={() => go(`/client-expediente/${c.clientId}`)}>
                <IonIcon icon={folderOpenOutline} slot="start" /><IonLabel>Expediente digital (KYC)</IonLabel>
              </IonItem>
            </IonList>

            <div className="adm-sheet-actions">
              <IonButton
                expand="block"
                fill="outline"
                color={inactive ? 'success' : 'danger'}
                disabled={!!vm.busy}
                onClick={() => confirmActive(inactive)}
              >
                {vm.busy === `${c.clientId}:active`
                  ? <IonSpinner name="crescent" />
                  : inactive ? 'Reactivar cuenta' : 'Desactivar cuenta'}
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default AdminClientSheet;
