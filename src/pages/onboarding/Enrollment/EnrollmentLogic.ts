import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { isStaffRole, hasCapability } from '../../../config/rolePermissions';
import { ClientCapability, grantClientCapability } from '../../../api/clientCapabilitiesApi';
import { productLandingRoute } from '../../../utils/productContext';
import { notifyDataChanged } from '../../../utils/refreshBus';
import { useToast } from '../../../hooks/useToast';
import { ENROLL_OPTIONS } from './EnrollmentConstants';

/**
 * Self-service enrollment into SmartLoans (/registro) — where a signed-in account
 * without a SmartLoans product lands. Grants the chosen capabilities for the
 * CURRENT company (clientCapabilities is company-scoped) and lands the client on
 * that product's dashboard, which runs the product's own onboarding (KYC,
 * pagaré, contrato, payout account). Grants only add rows: nothing the account
 * already has (POS, Rewards…) is touched. Same rules as POSVending's Enrollment.
 */
export function useEnrollment() {
  const history = useHistory();
  const {
    companyId, clientId, roleCode, clientCapabilities, refreshCapabilities, setActiveProduct, logout,
  } = useUser();
  const { showToast, toastProps } = useToast({ defaultColor: 'danger' });

  const held = useMemo(
    () => ENROLL_OPTIONS.filter(o => hasCapability(clientCapabilities, o.capability)).map(o => o.capability),
    [clientCapabilities],
  );
  const [selected, setSelected] = useState<ClientCapability[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Enrolling is a self-service action on the client's own record; staff act for a company.
  const blockedReason =
    isStaffRole(roleCode) ? 'Las cuentas de personal no se inscriben a SmartLoans desde aquí.'
      : !clientId || !companyId ? 'Tu cuenta no tiene un registro de cliente todavía. Pide ayuda en sucursal.'
      : null;

  const toggle = (capability: ClientCapability, on: boolean) =>
    setSelected(prev => (on ? [...new Set([...prev, capability])] : prev.filter(c => c !== capability)));

  const toGrant = selected.filter(c => !held.includes(c));
  const canSubmit = !blockedReason && accepted && toGrant.length > 0 && !saving;

  const goTo = (capability: ClientCapability) => {
    const option = ENROLL_OPTIONS.find(o => o.capability === capability);
    if (!option) return;
    setActiveProduct(option.product);
    history.replace(productLandingRoute(option.product, clientId));
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      for (const capability of toGrant) {
        console.log('[Enrollment] granting', capability, 'companyId=', companyId, 'clientId=', clientId);
        await grantClientCapability(companyId, clientId, capability);
      }
      await refreshCapabilities();
      notifyDataChanged('enrollment');
      goTo(toGrant[0]);
    } catch (err) {
      console.error('[Enrollment] grant failed:', err);
      showToast('No se pudo activar. Intenta de nuevo o contacta a soporte.');
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    logout();
    history.replace('/login');
  };

  return {
    held, selected, toggle, accepted, setAccepted,
    saving, canSubmit, submit, blockedReason, goTo, signOut, toastProps,
  };
}

export type EnrollmentVM = ReturnType<typeof useEnrollment>;
