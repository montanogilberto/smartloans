import { describe, it, expect } from 'vitest';
import { smartLoansLanding, smartLoansProductFor } from './smartLoansLanding';

describe('smartLoansLanding', () => {
  it('uses the active product when it is a SmartLoans one', () => {
    expect(smartLoansLanding(['borrower', 'lender'], 'lender', 7)).toBe('/lender-dashboard/7');
  });

  it('falls back to the first SmartLoans product when the active one is POS', () => {
    expect(smartLoansLanding(['pos', 'borrower'], 'pos', 7)).toBe('/client-dashboard/7');
  });

  it('sends juridical members to their dashboard', () => {
    expect(smartLoansLanding(['juridical'], null, 7)).toBe('/juridical-dashboard/7');
  });

  it('returns null for an account without SmartLoans products', () => {
    expect(smartLoansLanding(['pos', 'factory'], 'pos', 7)).toBeNull();
  });

  it('sends the platform admin to the admin dashboard first', () => {
    expect(smartLoansLanding(['admin', 'borrower'], null, 7)).toBe('/admin');
  });

  it('returns null without a client record', () => {
    expect(smartLoansLanding(['borrower'], 'borrower', 0)).toBeNull();
  });
});

describe('smartLoansProductFor', () => {
  it('keeps an active SmartLoans product', () => {
    expect(smartLoansProductFor(['pos', 'lender', 'borrower'], 'borrower')).toBe('borrower');
  });
  it('switches a POS session to the first SmartLoans product held', () => {
    expect(smartLoansProductFor(['pos', 'lender'], 'pos')).toBe('lender');
  });
  it('returns null when the account holds none', () => {
    expect(smartLoansProductFor(['pos'], 'pos')).toBeNull();
  });
});
