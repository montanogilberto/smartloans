/**
 * The company this app defaults to: dbo.companies 1008 'SmartLoans' (1 is
 * Lavandería GMO). Used only when a session carries no company — an account
 * keeps the company its client row belongs to, because clientCapabilities,
 * KYC and loans are checked against clients.companyId.
 */
export const SMARTLOANS_COMPANY_ID = 1008;

/**
 * The one GMO Prestamos platform administrator: the client whose phone
 * (clients.cellphone, compared by its last 10 digits — same rule as
 * sp_clientLoginCodes) matches this number gets the Administrador product.
 * UI gate only: the backend endpoints the admin screens read are the same
 * ones every session can call; a server-side admin role is still pending.
 */
export const GMO_PRESTAMOS_ADMIN_PHONE = '6624737005';

/**
 * Percentage GMO Prestamos tracks over each funded loan (monto colocado), shown
 * in the admin KPIs as "Comisión GMO Prestamos". Reporting only: the platform
 * is non-custodial and never charges or moves this money (CLAUDE.md §4).
 * There is no backend column for it yet — change it here.
 */
export const GMO_PRESTAMOS_FEE_PCT = 5;
