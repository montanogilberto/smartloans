import { describe, it, expect } from 'vitest';
import { isPlatformAdminPhone } from './platformAdmin';

describe('isPlatformAdminPhone', () => {
  it('matches the admin number in any format', () => {
    expect(isPlatformAdminPhone('6624737005')).toBe(true);
    expect(isPlatformAdminPhone('+526624737005')).toBe(true);
    expect(isPlatformAdminPhone('662 473 7005')).toBe(true);
  });
  it('rejects other numbers and empty values', () => {
    expect(isPlatformAdminPhone('6624737006')).toBe(false);
    expect(isPlatformAdminPhone('4737005')).toBe(false);
    expect(isPlatformAdminPhone('')).toBe(false);
    expect(isPlatformAdminPhone(undefined)).toBe(false);
  });
});
