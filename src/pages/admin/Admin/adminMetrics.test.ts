import { describe, it, expect } from 'vitest';
import type { Loan } from '../../../api/loanApi';
import type { Client } from '../../../api/clientsApi';
import type { ClientCapabilityRow } from '../../../api/clientCapabilitiesApi';
import { buildRoster, computeKpis, lenderBreakdown, lenderOfLoan, monthlyBreakdown } from './adminMetrics';

const loan = (p: Partial<Loan>): Loan => ({
  loanId: 1, companyId: 1008, loanNumber: 'L', clientId: 10, principalAmount: 1000,
  interestRate: 20, termMonths: 6, paymentFrequency: 'monthly', loanStatus: 'active', ...p,
});
const client = (p: Partial<Client>): Client => ({
  clientId: 1, first_name: 'A', last_name: 'B', cellphone: '', email: '', ...p,
});
const cap = (clientId: number, capability: ClientCapabilityRow['capability'], isActive = true): ClientCapabilityRow => ({
  clientCapabilityId: clientId, companyId: 1008, clientId, capability, isActive,
});

describe('computeKpis', () => {
  const loans = [
    loan({ loanId: 1, principalAmount: 1000, interestRate: 10, loanStatus: 'active', totalRepaymentAmount: 1100 }),
    loan({ loanId: 2, principalAmount: 3000, interestRate: 30, loanStatus: 'Overdue' }),
    loan({ loanId: 3, principalAmount: 1000, interestRate: 20, loanStatus: 'paidoff' }),
    loan({ loanId: 4, principalAmount: 9999, loanStatus: 'pending_funding' }),
    loan({ loanId: 5, principalAmount: 500, loanStatus: 'cancelled' }),
  ];
  const k = computeKpis({ loans, proposals: [], offers: [], roster: [], feePct: 5 });

  it('counts only funded loans as placed money', () => {
    expect(k.fundedCount).toBe(3);
    expect(k.fundedAmount).toBe(5000);
    expect(k.pipelineCount).toBe(1);
    expect(k.pipelineAmount).toBe(9999);
  });

  it('tracks the GMO Prestamos percentage over the funded amount', () => {
    expect(k.feeAmount).toBe(250);
  });

  it('reports late share of the open portfolio and settled share of funded loans', () => {
    expect(k.openAmount).toBe(4000);
    expect(k.latePct).toBe(75);
    expect(k.settledPct).toBe(33.3);
  });

  it('weights the average rate by amount', () => {
    expect(k.avgRate).toBe(24); // (1000*10 + 3000*30 + 1000*20) / 5000
    expect(k.expectedInterest).toBe(100);
  });

  it('is all zeros with no data', () => {
    const empty = computeKpis({ loans: [], proposals: [], offers: [], roster: [], feePct: 5 });
    expect(empty.fundedAmount).toBe(0);
    expect(empty.latePct).toBe(0);
    expect(empty.avgRate).toBe(0);
  });
});

describe('buildRoster', () => {
  it('uses active capabilities and the legacy clientType', () => {
    const roster = buildRoster(
      [client({ clientId: 1 }), client({ clientId: 2, clientType: 'both' }), client({ clientId: 3, clientType: 'lawyer' }), client({ clientId: 4 })],
      [cap(1, 'SMARTLOANS_LENDER'), cap(4, 'SMARTLOANS_BORROWER', false)],
    );
    expect(roster.map(r => [r.client.clientId, r.roles])).toEqual([
      [1, ['lender']],
      [2, ['borrower', 'lender']],
      [3, ['juridical']],
    ]);
  });
});

describe('lenders and months', () => {
  const loans = [
    loan({ loanId: 1, principalAmount: 1000, loanStatus: 'active', disbursementDate: '2026-10-03' }),
    loan({ loanId: 2, principalAmount: 2000, loanStatus: 'defaulted', notes: 'Prestamista clientId=77', disbursementDate: '2026-11-01' }),
    loan({ loanId: 3, principalAmount: 500, loanStatus: 'pending', created_At: '2026-11-10T00:00:00' }),
  ];

  it('finds the lender by contract, then by note', () => {
    expect(lenderOfLoan(loans[0], { 1: 55 })).toBe(55);
    expect(lenderOfLoan(loans[1], {})).toBe(77);
    expect(lenderOfLoan(loans[2], {})).toBeNull();
  });

  it('groups funded money per lender', () => {
    expect(lenderBreakdown(loans, { 1: 55 }, 5)).toEqual([
      { lenderId: 77, loans: 1, fundedAmount: 2000, lateAmount: 2000, feeAmount: 100 },
      { lenderId: 55, loans: 1, fundedAmount: 1000, lateAmount: 0, feeAmount: 50 },
    ]);
  });

  it('groups by month, newest first', () => {
    expect(monthlyBreakdown(loans, 5)).toEqual([
      { month: '2026-11', loans: 2, fundedAmount: 2000, feeAmount: 100, lateCount: 1 },
      { month: '2026-10', loans: 1, fundedAmount: 1000, feeAmount: 50, lateCount: 0 },
    ]);
  });
});
