import { describe, expect, it } from 'vitest';
import { BankAccount, bankAccountBucket, primaryBankAccount } from './bankingApi';

const acc = (over: Partial<BankAccount>): BankAccount => ({
  bankAccountId: 1, clientId: 1, clabeLast4: '9965', holderName: 'Titular',
  isVerified: false, isDefault: false, ...over,
});

describe('bankAccountBucket', () => {
  it('a freshly linked CLABE (PRIMARY by column default, unverified) is pending, not principal', () => {
    expect(bankAccountBucket(acc({ accountStatus: 'PRIMARY', isDefault: true }))).toBe('pending');
  });
  it('PRIMARY + verified is principal', () => {
    expect(bankAccountBucket(acc({ accountStatus: 'PRIMARY', isVerified: true, isDefault: true }))).toBe('primary');
  });
  it('ARCHIVED never counts, even verified', () => {
    expect(bankAccountBucket(acc({ accountStatus: 'ARCHIVED', isVerified: true, isDefault: true }))).toBe('archived');
  });
  it('without accountStatus, verified + default decides', () => {
    expect(bankAccountBucket(acc({ isVerified: true, isDefault: true }))).toBe('primary');
    expect(bankAccountBucket(acc({ isVerified: true }))).toBe('pending');
  });
  it('primaryBankAccount picks the verified principal', () => {
    const list = [acc({ bankAccountId: 1, accountStatus: 'PENDING_VERIFICATION', isVerified: true }),
      acc({ bankAccountId: 2, accountStatus: 'PRIMARY', isVerified: true, isDefault: true })];
    expect(primaryBankAccount(list)?.bankAccountId).toBe(2);
    expect(primaryBankAccount([acc({ accountStatus: 'PRIMARY' })])).toBeNull();
  });
});
