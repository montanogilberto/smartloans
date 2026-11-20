import { describe, it, expect } from 'vitest';
import { pinnedClientId } from './ownClientId';

describe('pinnedClientId', () => {
  it('ignores a foreign clientId in the URL for a customer', () => {
    expect(pinnedClientId('2165', 3371, 'pos')).toBe(3371);
    expect(pinnedClientId('2165', 3371, 'lender')).toBe(3371);
    expect(pinnedClientId('2165', 3371, 'borrower')).toBe(3371);
  });

  it('uses the session clientId when the URL has none', () => {
    expect(pinnedClientId(undefined, 3371, 'lender')).toBe(3371);
  });

  it('honors the URL clientId for staff', () => {
    expect(pinnedClientId('2165', 0, 'admin')).toBe(2165);
    expect(pinnedClientId('2165', 0, 'manager')).toBe(2165);
  });

  it('falls back to the session for staff with a bad URL id', () => {
    expect(pinnedClientId('abc', 7, 'admin')).toBe(7);
  });
});
