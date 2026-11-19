/**
 * The company this app runs as. SmartLoans is one tenant of the shared backend
 * (dbo.companies 1008 'SmartLoans'; 1 is Lavandería GMO). Every session in this
 * app is pinned to it — capabilities, KYC, enrollment grants and loan data are
 * all company-scoped — whatever company the account's user row points at
 * (legacy borrowers were created under company 1).
 */
export const SMARTLOANS_COMPANY_ID = 1008;
