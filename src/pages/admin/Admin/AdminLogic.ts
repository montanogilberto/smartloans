/**
 * AdminLogic — state, loading and actions of the GMO Prestamos admin dashboard
 * (/admin/:section). The views only paint this vm (MVVM, like the other pages).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIonViewWillEnter } from '@ionic/react';
import { useUser } from '../../../contexts/UserContext';
import { getAllLoans, Loan } from '../../../api/loanApi';
import { Client, getAllClients, setClientActive } from '../../../api/clientsApi';
import {
  ClientCapabilityRow, grantClientCapability, listClientCapabilities, revokeClientCapability,
} from '../../../api/clientCapabilitiesApi';
import {
  MarketplaceOffer, MarketplaceProposal, fetchActiveLoanOffers, fetchLoanProposals,
} from '../../../api/loanMarketplaceApi';
import { listContractsForClient } from '../../../api/digitalContractsApi';
import { GMO_PRESTAMOS_FEE_PCT } from '../../../config/appCompany';
import { notifyDataChanged, onDataChanged } from '../../../utils/refreshBus';
import {
  AdminRole, FUNDED_STATUSES, LATE_STATUSES, OPEN_STATUSES, PIPELINE_STATUSES, ROLE_CAPABILITY,
  SETTLED_STATUSES, buildRoster, computeKpis, heldCapabilities, lenderBreakdown, lenderOfLoan, monthlyBreakdown,
} from './adminMetrics';

export type AdminSection = 'resumen' | 'loans' | 'proposals' | 'borrowers' | 'lenders' | 'juridical' | 'kpi';

const SECTIONS: readonly AdminSection[] = ['resumen', 'loans', 'proposals', 'borrowers', 'lenders', 'juridical', 'kpi'];

export const SECTION_TITLES: Record<AdminSection, string> = {
  resumen: 'Administrador',
  loans: 'Préstamos',
  proposals: 'Solicitudes',
  borrowers: 'Acreditados',
  lenders: 'Prestamistas',
  juridical: 'Jurídico',
  kpi: 'KPI y comisión',
};

export type LoanFilter = 'all' | 'open' | 'late' | 'pipeline' | 'settled';

const FILTER_STATUSES: Record<Exclude<LoanFilter, 'all'>, readonly string[]> = {
  open: OPEN_STATUSES,
  late: LATE_STATUSES,
  pipeline: PIPELINE_STATUSES,
  settled: SETTLED_STATUSES,
};

const fullName = (c?: Client) => (c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || `Cliente #${c.clientId}` : '');

export function useAdmin() {
  const { section: sectionParam } = useParams<{ section?: string }>();
  const section: AdminSection = SECTIONS.includes(sectionParam as AdminSection) ? (sectionParam as AdminSection) : 'resumen';
  const { companyId, isPlatformAdmin, username } = useUser();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [capabilities, setCapabilities] = useState<ClientCapabilityRow[]>([]);
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  /** loanId → lender clientId, from loanContracts. */
  const [contractLender, setContractLender] = useState<Record<number, number>>({});
  // First load shows a page spinner (never zeros before the data arrives);
  // later reloads keep the data on screen and spin the refresh button.
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  /** `${clientId}:${action}` of the mutation in flight — disables its button. */
  const [busy, setBusy] = useState<string | null>(null);
  const loadSeq = useRef(0);

  const [loanFilter, setLoanFilter] = useState<LoanFilter>('all');
  const [loanSearch, setLoanSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!isPlatformAdmin || !companyId) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    setError('');
    try {
      const [allLoans, allClients, caps, props, offs] = await Promise.all([
        getAllLoans(companyId),
        getAllClients(),
        listClientCapabilities(companyId),
        fetchLoanProposals(companyId),
        fetchActiveLoanOffers(companyId),
      ]);
      const companyClients = allClients.filter(c => !c.companyId || c.companyId === companyId);
      // Lender of each loan: contracts of every lender (loans has no lenderId column).
      const lenderIds = buildRoster(companyClients, caps).filter(r => r.roles.includes('lender')).map(r => r.client.clientId);
      const contracts = (await Promise.all(
        lenderIds.map(id => listContractsForClient(companyId, id).catch(() => [])),
      )).flat();
      if (seq !== loadSeq.current) return;
      const map: Record<number, number> = {};
      contracts.forEach(c => { if (c.lenderClientId) map[c.loanId] = c.lenderClientId; });
      console.log('[Admin] load ✅', JSON.stringify({
        loans: allLoans.length, clients: companyClients.length, caps: caps.length,
        proposals: props.length, offers: offs.length, contracts: contracts.length,
      }));
      setLoans(allLoans);
      setClients(companyClients);
      setCapabilities(caps);
      setProposals(props);
      setOffers(offs);
      setContractLender(map);
      setLoaded(true);
    } catch (e) {
      console.log('[Admin] load ❌', String(e));
      if (seq === loadSeq.current) setError('No se pudo cargar la información. Intenta de nuevo.');
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [isPlatformAdmin, companyId]);

  useIonViewWillEnter(() => { load(); });
  useEffect(() => { load(); }, [load]);
  useEffect(() => onDataChanged(reason => {
    console.log('[Admin] data-changed →', reason);
    load();
  }), [load]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const clientById = useMemo(() => {
    const m = new Map<number, Client>();
    clients.forEach(c => m.set(c.clientId, c));
    return m;
  }, [clients]);
  const clientName = useCallback((id?: number | null) => {
    if (!id) return '—';
    return fullName(clientById.get(id)) || `Cliente #${id}`;
  }, [clientById]);

  const roster = useMemo(() => buildRoster(clients, capabilities), [clients, capabilities]);
  const feePct = GMO_PRESTAMOS_FEE_PCT;
  const kpis = useMemo(
    () => computeKpis({ loans, proposals, offers, roster, feePct }),
    [loans, proposals, offers, roster, feePct],
  );
  const months = useMemo(() => monthlyBreakdown(loans, feePct), [loans, feePct]);
  const lenderRows = useMemo(() => lenderBreakdown(loans, contractLender, feePct), [loans, contractLender, feePct]);
  const lenderOf = useCallback((l: Loan) => lenderOfLoan(l, contractLender), [contractLender]);

  const sortedLoans = useMemo(() => [...loans].sort((a, b) =>
    new Date(b.disbursementDate ?? b.created_At ?? 0).getTime() - new Date(a.disbursementDate ?? a.created_At ?? 0).getTime(),
  ), [loans]);

  const visibleLoans = useMemo(() => {
    const q = loanSearch.trim().toLowerCase();
    return sortedLoans.filter(l => {
      if (loanFilter !== 'all' && !FILTER_STATUSES[loanFilter].includes((l.loanStatus ?? '').toLowerCase())) return false;
      if (!q) return true;
      return [l.loanNumber, clientName(l.clientId), clientName(lenderOf(l)), String(l.loanId)]
        .some(v => (v ?? '').toLowerCase().includes(q));
    });
  }, [sortedLoans, loanFilter, loanSearch, clientName, lenderOf]);

  const sortedProposals = useMemo(() => [...proposals].sort((a, b) =>
    (b.created_At ?? '').localeCompare(a.created_At ?? ''),
  ), [proposals]);

  const membersOf = useCallback((role: AdminRole) => {
    const q = clientSearch.trim().toLowerCase();
    return roster
      .filter(r => r.roles.includes(role))
      .filter(r => !q || [fullName(r.client), r.client.cellphone, r.client.email, String(r.client.clientId)]
        .some(v => (v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => fullName(a.client).localeCompare(fullName(b.client), 'es'));
  }, [roster, clientSearch]);

  /** Per-client loan stats for the roster rows and the client sheet. */
  const statsFor = useCallback((clientId: number) => {
    const asBorrower = loans.filter(l => l.clientId === clientId);
    const asLender = loans.filter(l => lenderOf(l) === clientId);
    const funded = (ls: Loan[]) => ls.filter(l => FUNDED_STATUSES.includes((l.loanStatus ?? '').toLowerCase() as never));
    const late = (ls: Loan[]) => ls.filter(l => LATE_STATUSES.includes((l.loanStatus ?? '').toLowerCase() as never));
    const amount = (ls: Loan[]) => ls.reduce((s, l) => s + Number(l.approvedAmount ?? l.principalAmount ?? 0), 0);
    return {
      borrowedCount: asBorrower.length,
      borrowedAmount: amount(funded(asBorrower)),
      borrowerLate: late(asBorrower).length,
      lentCount: asLender.length,
      lentAmount: amount(funded(asLender)),
      lenderLate: late(asLender).length,
      offeredCapital: offers.filter(o => o.lenderId === clientId && o.isActive)
        .reduce((s, o) => s + Number(o.availableCapital || 0), 0),
    };
  }, [loans, lenderOf, offers]);

  const selectedClient = selectedClientId ? clientById.get(selectedClientId) ?? null : null;
  const selectedRoles = useMemo(
    () => roster.find(r => r.client.clientId === selectedClientId)?.roles ?? [],
    [roster, selectedClientId],
  );
  const selectedHeld = useMemo(
    () => (selectedClientId ? heldCapabilities(selectedClientId, capabilities) : new Set<string>()),
    [selectedClientId, capabilities],
  );

  // ── Actions (each confirmed in the view before it gets here) ─────────────
  const run = async (key: string, action: () => Promise<unknown>): Promise<string | null> => {
    setBusy(key);
    try {
      await action();
      notifyDataChanged('admin');
      await load();
      return null;
    } catch (e) {
      console.log('[Admin] action ❌', key, String(e));
      return e instanceof Error ? e.message : 'Error desconocido';
    } finally {
      setBusy(null);
    }
  };

  const setRole = (clientId: number, role: AdminRole, enabled: boolean) =>
    run(`${clientId}:${role}`, () => (enabled
      ? grantClientCapability(companyId, clientId, ROLE_CAPABILITY[role])
      : revokeClientCapability(companyId, clientId, ROLE_CAPABILITY[role])));

  const setActive = (clientId: number, active: boolean) =>
    run(`${clientId}:active`, () => setClientActive(clientId, active));

  return {
    section, title: SECTION_TITLES[section], username, isPlatformAdmin,
    loaded, loading, error, load, busy,
    kpis, months, lenderRows, feePct,
    loans: sortedLoans, visibleLoans, loanFilter, setLoanFilter, loanSearch, setLoanSearch, lenderOf, clientName,
    proposals: sortedProposals, offers,
    membersOf, clientSearch, setClientSearch, statsFor,
    selectedClient, selectedRoles, selectedHeld, openClient: setSelectedClientId,
    closeClient: () => setSelectedClientId(null),
    setRole, setActive,
  };
}

export type AdminVM = ReturnType<typeof useAdmin>;
