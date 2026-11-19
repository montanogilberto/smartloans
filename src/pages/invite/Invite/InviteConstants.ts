/**
 * SmartLoans store links. Play's URL follows from the bundle id
 * (capacitor.config.ts appId) and works once the app is published; the App
 * Store id only exists after Apple approves the app — leave it null until then
 * and the invite simply omits the iOS link.
 */
export const SMARTLOANS_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.factoryAI.gmoprestamos';
export const SMARTLOANS_APP_STORE_URL: string | null = null;

export const INVITE_TITLE = 'Te invito a GMO Prestamos';

/** The message shared through the phone's share sheet (WhatsApp, SMS, correo…). */
export const buildInviteMessage = (inviterName: string): string => {
  const who = inviterName.trim() ? `${inviterName.trim()} te invita` : 'Te invito';
  const links = [
    `Android: ${SMARTLOANS_PLAY_STORE_URL}`,
    SMARTLOANS_APP_STORE_URL ? `iPhone: ${SMARTLOANS_APP_STORE_URL}` : null,
  ].filter(Boolean).join('\n');
  return `${who} a GMO Prestamos: préstamos entre personas, con pagos directos por SPEI.\n\nDescarga la app:\n${links}`;
};
