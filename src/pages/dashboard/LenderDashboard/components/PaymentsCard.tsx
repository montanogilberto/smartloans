import React, { useState } from 'react';
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon,
  IonModal, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/react';
import { cardOutline, checkmarkCircle, ellipseOutline, lockClosedOutline, refreshOutline } from 'ionicons/icons';
import BankAccountLink from '../../../../components/payments/BankAccountLink';
import { bankAccountBucket } from '../../../../api/bankingApi';
import { LenderDashboardVM } from '../LenderDashboardLogic';
import CollapsibleHeader, { useCollapsed } from './CollapsibleHeader';

/**
 * Cuenta de pago = la CLABE de SmartLoans donde el prestamista recibe por SPEI
 * directo los pagos de sus prestatarios (RFC-016: sin Stripe Connect, el dinero
 * nunca pasa por GMO). Misma regla que el resto de la app: sólo una CLABE
 * PRIMARY **y verificada** recibe dinero (bankingApi.primaryBankAccount).
 * id="ld-pagos" is the scroll target for the bottom-nav "Pagos" tab (?section=pagos).
 */
const PaymentsCard: React.FC<{ vm: LenderDashboardVM }> = ({ vm }) => {
  const [showBankModal, setShowBankModal] = useState(false);
  const primary = vm.primaryBankAccount;
  const pending = vm.bankAccounts.find(a => bankAccountBucket(a) === 'pending' && !a.isVerified) ?? null;
  const linked = primary ?? pending;
  const locked = !!pending?.verificationLocked;

  const steps = [
    { ok: vm.identityVerified, label: 'Identidad verificada',
      sub: vm.identityVerified ? undefined : 'Completa la verificación de identidad' },
    { ok: !!linked, label: 'CLABE vinculada',
      sub: linked ? `${linked.bankName ?? 'Banco'} · ····${linked.clabeLast4}` : 'Pendiente' },
    { ok: !!primary, label: 'CLABE verificada',
      sub: primary ? 'Lista para recibir pagos por SPEI'
        : locked ? 'Bloqueada por intentos — contacta a soporte'
        : pending ? 'Pendiente de verificación'
        : 'Pendiente', locked },
  ];
  const stepsDone = steps.filter(s => s.ok).length;
  const complete = stepsDone === steps.length;
  const [collapsed, toggle] = useCollapsed('payments', complete);

  const summary = !vm.bankAccountsLoaded
    ? 'Cargando…'
    : complete
      ? `✓ Lista · ····${primary?.clabeLast4 ?? ''}`
      : `${stepsDone} de ${steps.length} pasos`;
  const cta = primary ? 'Administrar mi CLABE' : pending ? 'Verificar mi CLABE' : 'Vincular mi CLABE';

  return (
    <IonCard className="ld-card" id="ld-pagos">
      <CollapsibleHeader
        title="Cuenta de pago" collapsed={collapsed} onToggle={toggle} summary={summary}
        progress={vm.bankAccountsLoaded ? stepsDone / steps.length : undefined}
        actions={(
          <IonButton fill="clear" size="small" aria-label="Actualizar"
            disabled={vm.bankAccountsRefreshing} onClick={vm.reloadBankAccounts}>
            {vm.bankAccountsRefreshing
              ? <IonSpinner name="crescent" />
              : <IonIcon icon={refreshOutline} slot="icon-only" />}
          </IonButton>
        )}
      />
      {!collapsed && (
        <IonCardContent>
          {!vm.bankAccountsLoaded ? (
            <div className="ldx-graph-loading"><IonSpinner name="crescent" /><span>Cargando tu cuenta…</span></div>
          ) : (
            <>
              {!linked && (
                <div className="ldx-payments-empty">
                  <IonIcon icon={cardOutline} />
                  <p className="ldx-payments-empty-title">Sin CLABE registrada.</p>
                  <p className="ldx-payments-empty-sub">
                    Vincula tu CLABE para que tus prestatarios te paguen por SPEI directo a tu banco.
                  </p>
                </div>
              )}
              <div className="ldx-checklist">
                {steps.map((row, i, arr) => (
                  <div key={row.label} className="ldx-check-row">
                    <div className="ldx-check-rail">
                      <IonIcon icon={row.ok ? checkmarkCircle : row.locked ? lockClosedOutline : ellipseOutline}
                        className={row.ok ? 'ldx-check-ok' : 'ldx-check-off'} />
                      {i < arr.length - 1 && <span className="ldx-check-line" />}
                    </div>
                    <div className="ldx-check-text">
                      <strong>{row.label}</strong>
                      {row.sub && <p>{row.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <IonButton shape="round" expand="block" fill={primary ? 'outline' : 'solid'}
                className="ldx-payments-complete-btn" onClick={() => setShowBankModal(true)}>
                <IonIcon icon={cardOutline} slot="start" />
                {cta}
              </IonButton>
            </>
          )}
        </IonCardContent>
      )}

      <IonModal isOpen={showBankModal} onDidDismiss={() => setShowBankModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Cuenta bancaria (SPEI)</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowBankModal(false)}>Cerrar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <BankAccountLink
            clientId={vm.lenderClientId}
            companyId={Number(vm.companyId)}
            holderName={vm.lenderHolderName}
            onChanged={vm.setBankAccounts}
          />
        </IonContent>
      </IonModal>
    </IonCard>
  );
};

export default PaymentsCard;
