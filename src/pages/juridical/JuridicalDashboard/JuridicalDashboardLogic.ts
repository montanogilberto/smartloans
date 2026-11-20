import { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useIonViewWillEnter, useIonViewWillLeave } from '@ionic/react';
import { useUser } from '../../../contexts/UserContext';
import { isStaffRole, hasCapability } from '../../../config/rolePermissions';
import { ClientFollowUp, getAllClientFollowUps } from '../../../api/clientFollowUpApi';
import { onDataChanged } from '../../../utils/refreshBus';
import { getAllClientFaceRecognitions } from '../../../api/clientFaceRecognitionApi';
import { CONTRACT_TEXT } from '../../loans/BorrowerOnboarding/documents/contract';
import { PAGARE_TEXT } from '../../loans/BorrowerOnboarding/documents/pagare';
import { JURIDICAL_CONTRACT_TEXT } from '../../loans/BorrowerOnboarding/documents/juridicalContract';

export const LEGAL_TEMPLATES = [
  { id: 'servicios', title: 'Tu contrato de servicios con GMO Prestamos', text: JURIDICAL_CONTRACT_TEXT },
  { id: 'contrato', title: 'Contrato de crédito personal P2P', text: CONTRACT_TEXT },
  { id: 'pagare',   title: 'Pagaré (LGTOC arts. 170-174)',     text: PAGARE_TEXT },
] as const;

export type LegalTemplate = typeof LEGAL_TEMPLATES[number];

/**
 * Juridical (SMARTLOANS_JURIDICAL) dashboard. Scope is deliberately the
 * lawyer's OWN record: there is no assignment model yet saying which other
 * clients' contracts a lawyer may read, so none are exposed. Assignments are
 * recorded by staff as clientFollowUps on the lawyer's client file (Clientes →
 * Seguimiento), and the legal templates come from the same static documents
 * the borrower signs.
 */
export function useJuridicalDashboard() {
  const { clientId: clientIdParam } = useParams<{ clientId?: string }>();
  const { clientId: contextClientId, companyId, roleCode, username, clientCapabilities, isPlatformAdmin } = useUser();
  // Same rule as MyLoans: the URL id only counts for staff.
  const paramId = clientIdParam ? Number(clientIdParam) : null;
  // The platform admin (utils/platformAdmin.ts) reviews any lawyer's panel too.
  const canViewOthers = isStaffRole(roleCode) || isPlatformAdmin;
  const clientId = paramId !== null && canViewOthers ? paramId : contextClientId;
  const isMember = canViewOthers || hasCapability(clientCapabilities, 'SMARTLOANS_JURIDICAL');

  const [items, setItems] = useState<ClientFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [openTemplate, setOpenTemplate] = useState<LegalTemplate | null>(null);
  // The services contract with GMO Prestamos, signed in the Expediente wizard
  // (registerAs 'juridical'). null = not loaded yet, so the card shows a spinner
  // instead of a "sin firmar" that may be false.
  const [contract, setContract] = useState<{ signed: boolean; pdfUrl?: string } | null>(null);
  const history = useHistory();

  const loadContract = useCallback(async () => {
    if (!companyId || !clientId || !isMember) return;
    try {
      const rec = (await getAllClientFaceRecognitions(companyId)).find(f => f.clientId === clientId);
      setContract({ signed: !!rec?.contractAccepted, pdfUrl: rec?.contractPdfBlobUrl });
    } catch (e) {
      console.warn('[JuridicalDashboard] contract status unavailable:', String(e));
      setContract({ signed: false });
    }
  }, [companyId, clientId, isMember]);

  const [signingStarting, setSigningStarting] = useState(false);
  const startSigning = () => {
    if (signingStarting || !clientId) return;
    setSigningStarting(true);
    history.push('/clientFaceRecognitions', {
      clientId,
      continueToPayments: false,
      returnTo: `/juridical-dashboard/${clientId}`,
      registerAs: 'juridical',
    });
  };

  const load = useCallback(async () => {
    if (!companyId || !clientId || !isMember) return;
    setLoading(true);
    try {
      const rows = await getAllClientFollowUps(companyId, clientId);
      console.log('[JuridicalDashboard] follow-ups for clientId=%d: %d', clientId, rows.length);
      setItems([...rows].sort((a, b) => (b.created_At ?? '').localeCompare(a.created_At ?? '')));
    } finally {
      setLoading(false);
    }
  }, [companyId, clientId, isMember]);

  useIonViewWillEnter(() => { load(); loadContract(); setSigningStarting(false); });
  // Ionic keeps this page mounted: close the template viewer when leaving
  // (e.g. switching product) so it doesn't float over the next page.
  useIonViewWillLeave(() => { setOpenTemplate(null); });
  useEffect(() => onDataChanged(() => { load(); loadContract(); }), [load, loadContract]);

  const pendingCount = items.filter(i => i.status === 'pending').length;

  return {
    username, isMember, items, loading, load, pendingCount, openTemplate, setOpenTemplate,
    contract, startSigning, signingStarting,
  };
}

export type JuridicalDashboardVM = ReturnType<typeof useJuridicalDashboard>;
