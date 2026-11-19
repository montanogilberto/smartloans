/**
 * The company this app defaults to: dbo.companies 1008 'SmartLoans' (1 is
 * Lavandería GMO). Used only when a session carries no company — an account
 * keeps the company its client row belongs to, because clientCapabilities,
 * KYC and loans are checked against clients.companyId.
 */
export const SMARTLOANS_COMPANY_ID = 1008;
