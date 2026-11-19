/**
 * The SmartLoans mark (coin + lend/repay arrows) — same artwork as the app icon
 * (resources/icon.svg). Arrows and coin use currentColor, so on the login logo
 * box they render white like the old ionicon did.
 */
export const SMARTLOANS_MARK_SRC = '/icons/smartloans-mark.svg';

/** Every sign-in lands on /inicio, which picks the SmartLoans product dashboard (or /registro).
 * Never a POS home (/rewards-dashboard…): those routes don't exist here, and reaching a
 * dashboard through the catch-all left it without its :clientId param. */
export const POST_LOGIN_ROUTE = '/inicio';
