/**
 * adminMetrics — pure KPI math for the GMO Prestamos admin dashboard.
 * No fetch, no React: AdminLogic loads the rows and these functions shape them,
 * so the numbers can be unit-tested (adminMetrics.test.ts).
 */
import type { Loan } from '../../../api/loanApi';
import type { Client } from '../../../api/clientsApi';
import type { ClientCapabilityRow } from '../../../api/clientCapabilitiesApi';
import type { MarketplaceOffer, MarketplaceProposal } from '../../../api/loanMarketplaceApi';

// ── Loan buckets (loans.loanStatus, compared in lowercase) ──────────────────
/** Money actually lent: the loan was funded (SPEI lender → borrower confirmed). */
export const FUNDED_STATUSES = ['active', 'overdue', 'defaulted', 'paidoff', 'closed'] as const;
/** Still owed: funded and not settled. */
export const OPEN_STATUSES = ['active', 'overdue', 'defaulted'] as const;
export const LATE_STATUSES = ['overdue', 'defaulted'] as const;
export const SETTLED_STATUSES = ['paidoff', 'closed'] as const;
/** Approved but not funded yet, or not approved. */
export const PIPELINE_STATUSES = ['pending', 'pending_funding'] as const;

const statusOf = (l: Loan) => (l.loanStatus ?? '').toLowerCase();
const isIn = (l: Loan, list: readonly string[]) => list.includes(statusOf(l));

/** The amount a loan put in the borrower's hands. */
export const loanAmount = (l: Loan): number => Number(l.approvedAmount ?? l.principalAmount ?? 0) || 0;

/** Interest the loan carries: total to repay minus the amount lent (0 when unknown). */
export const loanInterest = (l: Loan): number => {
  const total = Number(l.totalRepaymentAmount ?? 0);
  return total > 0 ? Math.max(0, total - loanAmount(l)) : 0;
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** 0–100 with one decimal; 0 when there is no base. */
export const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Roster: who is a borrower / lender / lawyer ─────────────────────────────
export type AdminRole = 'borrower' | 'lender' | 'juridical';

export const ROLE_CAPABILITY: Record<AdminRole, ClientCapabilityRow['capability']> = {
  borrower: 'SMARTLOANS_BORROWER',
  lender: 'SMARTLOANS_LENDER',
  juridical: 'SMARTLOANS_JURIDICAL',
};

export interface RosterEntry {
  client: Client;
  roles: AdminRole[];
}

/**
 * Members of each SmartLoans product: an active clientCapabilities row, or the
 * legacy clients.clientType for accounts created before capabilities existed.
 */
export const buildRoster = (clients: Client[], capabilities: ClientCapabilityRow[]): RosterEntry[] => {
  const caps = new Map<number, Set<string>>();
  capabilities.filter(c => c.isActive).forEach(c => {
    if (!caps.has(c.clientId)) caps.set(c.clientId, new Set());
    caps.get(c.clientId)!.add(c.capability);
  });
  const out: RosterEntry[] = [];
  clients.forEach(client => {
    const held = caps.get(client.clientId) ?? new Set<string>();
    const t = client.clientType;
    const roles: AdminRole[] = [];
    if (held.has('SMARTLOANS_BORROWER') || t === 'borrower' || t === 'both') roles.push('borrower');
    if (held.has('SMARTLOANS_LENDER') || t === 'lender' || t === 'both') roles.push('lender');
    if (held.has('SMARTLOANS_JURIDICAL') || t === 'lawyer') roles.push('juridical');
    if (roles.length) out.push({ client, roles });
  });
  return out;
};

/** The capabilities (not legacy clientType) a client holds — what the admin can revoke. */
export const heldCapabilities = (clientId: number, capabilities: ClientCapabilityRow[]): Set<string> =>
  new Set(capabilities.filter(c => c.clientId === clientId && c.isActive).map(c => c.capability));

// ── Lender of each loan ─────────────────────────────────────────────────────
/** loans has no lenderId: contracts first, then the "Prestamista clientId=N" note (same rule as MyLoans). */
export const lenderOfLoan = (loan: Loan, contractLender: Record<number, number>): number | null => {
  if (contractLender[loan.loanId]) return contractLender[loan.loanId];
  const m = loan.notes?.match(/Prestamista clientId=(\d+)/);
  return m ? Number(m[1]) : null;
};

// ── KPIs ────────────────────────────────────────────────────────────────────
export interface AdminKpis {
  loansTotal: number;
  byStatus: Record<string, number>;
  fundedCount: number;
  /** Monto colocado: sum lent across funded loans. */
  fundedAmount: number;
  openCount: number;
  /** Cartera vigente: amount still owed (funded − settled). */
  openAmount: number;
  lateCount: number;
  lateAmount: number;
  /** % of the open portfolio (by amount) that is overdue or defaulted. */
  latePct: number;
  settledCount: number;
  /** % of funded loans already paid off / closed. */
  settledPct: number;
  pipelineCount: number;
  pipelineAmount: number;
  /** Principal-weighted average annual rate of funded loans. */
  avgRate: number;
  avgTermMonths: number;
  avgTicket: number;
  expectedInterest: number;
  /** The percentage GMO Prestamos tracks over the funded amount. */
  feePct: number;
  /** feePct × fundedAmount — reporting figure, never charged by the app. */
  feeAmount: number;
  proposalsTotal: number;
  proposalsPending: number;
  /** accepted / decided proposals. */
  acceptancePct: number;
  offersActive: number;
  publishedCapital: number;
  borrowers: number;
  lenders: number;
  juridical: number;
  inactiveClients: number;
}

export const computeKpis = (input: {
  loans: Loan[];
  proposals: MarketplaceProposal[];
  offers: MarketplaceOffer[];
  roster: RosterEntry[];
  feePct: number;
}): AdminKpis => {
  const { loans, proposals, offers, roster, feePct } = input;
  const byStatus: Record<string, number> = {};
  loans.forEach(l => { const s = statusOf(l) || 'sin estado'; byStatus[s] = (byStatus[s] ?? 0) + 1; });

  const funded = loans.filter(l => isIn(l, FUNDED_STATUSES));
  const open = loans.filter(l => isIn(l, OPEN_STATUSES));
  const late = loans.filter(l => isIn(l, LATE_STATUSES));
  const settled = loans.filter(l => isIn(l, SETTLED_STATUSES));
  const pipeline = loans.filter(l => isIn(l, PIPELINE_STATUSES));

  const fundedAmount = sum(funded.map(loanAmount));
  const openAmount = sum(open.map(loanAmount));
  const lateAmount = sum(late.map(loanAmount));
  const weightedRate = fundedAmount > 0
    ? sum(funded.map(l => loanAmount(l) * Number(l.interestRate || 0))) / fundedAmount
    : 0;

  const decided = proposals.filter(p => p.status !== 'pending' && p.status !== 'countered');
  const accepted = proposals.filter(p => p.status === 'accepted');

  return {
    loansTotal: loans.length,
    byStatus,
    fundedCount: funded.length,
    fundedAmount: round2(fundedAmount),
    openCount: open.length,
    openAmount: round2(openAmount),
    lateCount: late.length,
    lateAmount: round2(lateAmount),
    latePct: pct(lateAmount, openAmount),
    settledCount: settled.length,
    settledPct: pct(settled.length, funded.length),
    pipelineCount: pipeline.length,
    pipelineAmount: round2(sum(pipeline.map(loanAmount))),
    avgRate: Math.round(weightedRate * 100) / 100,
    avgTermMonths: funded.length ? Math.round((sum(funded.map(l => Number(l.termMonths || 0))) / funded.length) * 10) / 10 : 0,
    avgTicket: funded.length ? round2(fundedAmount / funded.length) : 0,
    expectedInterest: round2(sum(funded.map(loanInterest))),
    feePct,
    feeAmount: round2(fundedAmount * feePct / 100),
    proposalsTotal: proposals.length,
    proposalsPending: proposals.filter(p => p.status === 'pending' || p.status === 'countered').length,
    acceptancePct: pct(accepted.length, decided.length),
    offersActive: offers.filter(o => o.isActive).length,
    publishedCapital: round2(sum(offers.filter(o => o.isActive).map(o => Number(o.availableCapital || 0)))),
    borrowers: roster.filter(r => r.roles.includes('borrower')).length,
    lenders: roster.filter(r => r.roles.includes('lender')).length,
    juridical: roster.filter(r => r.roles.includes('juridical')).length,
    inactiveClients: roster.filter(r => r.client.isActive === false).length,
  };
};

// ── Monthly tracking ────────────────────────────────────────────────────────
export interface MonthRow {
  /** 'YYYY-MM' */
  month: string;
  loans: number;
  fundedAmount: number;
  feeAmount: number;
  lateCount: number;
}

/** Loans by the month they were disbursed (or created), most recent first. */
export const monthlyBreakdown = (loans: Loan[], feePct: number, months = 12): MonthRow[] => {
  const rows = new Map<string, MonthRow>();
  loans.forEach(l => {
    const date = l.disbursementDate ?? l.created_At;
    if (!date) return;
    const month = date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    const row = rows.get(month) ?? { month, loans: 0, fundedAmount: 0, feeAmount: 0, lateCount: 0 };
    row.loans += 1;
    if (isIn(l, FUNDED_STATUSES)) row.fundedAmount = round2(row.fundedAmount + loanAmount(l));
    if (isIn(l, LATE_STATUSES)) row.lateCount += 1;
    row.feeAmount = round2(row.fundedAmount * feePct / 100);
    rows.set(month, row);
  });
  return [...rows.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, months);
};

/** Per-lender totals: how much each one placed and how much of it is late. */
export interface LenderRow {
  lenderId: number;
  loans: number;
  fundedAmount: number;
  lateAmount: number;
  feeAmount: number;
}

export const lenderBreakdown = (
  loans: Loan[], contractLender: Record<number, number>, feePct: number,
): LenderRow[] => {
  const rows = new Map<number, LenderRow>();
  loans.filter(l => isIn(l, FUNDED_STATUSES)).forEach(l => {
    const id = lenderOfLoan(l, contractLender);
    if (!id) return;
    const row = rows.get(id) ?? { lenderId: id, loans: 0, fundedAmount: 0, lateAmount: 0, feeAmount: 0 };
    row.loans += 1;
    row.fundedAmount = round2(row.fundedAmount + loanAmount(l));
    if (isIn(l, LATE_STATUSES)) row.lateAmount = round2(row.lateAmount + loanAmount(l));
    row.feeAmount = round2(row.fundedAmount * feePct / 100);
    rows.set(id, row);
  });
  return [...rows.values()].sort((a, b) => b.fundedAmount - a.fundedAmount);
};

/** "nov 2026" for a 'YYYY-MM' key. */
export const monthLabel = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('es-MX', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};
