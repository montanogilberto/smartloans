import { describe, expect, it } from 'vitest';
import { SMARTLOANS_PLAY_STORE_URL, buildInviteMessage } from './InviteConstants';

describe('buildInviteMessage', () => {
  it('names the inviter and includes the Play Store link', () => {
    const msg = buildInviteMessage('Jose Antonio');
    expect(msg.startsWith('Jose Antonio te invita a GMO Prestamos')).toBe(true);
    expect(msg).toContain(SMARTLOANS_PLAY_STORE_URL);
  });

  it('falls back to "Te invito" without a name', () => {
    expect(buildInviteMessage('  ').startsWith('Te invito a GMO Prestamos')).toBe(true);
  });

  it('omits the iPhone line while there is no App Store link', () => {
    expect(buildInviteMessage('Ana')).not.toContain('iPhone:');
  });

  it('links the GMO Prestamos app, never the POS one', () => {
    expect(SMARTLOANS_PLAY_STORE_URL).toContain('com.factoryAI.gmoprestamos');
  });
});
