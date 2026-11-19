import { ProductContext, productLandingRoute } from './productContext';

/** The products this app serves. A login can also hold POS / Factory AI — those live in other apps. */
export const SMARTLOANS_PRODUCTS: readonly ProductContext[] = ['borrower', 'lender', 'juridical'];

export const isSmartLoansProduct = (p: ProductContext | null | undefined): p is ProductContext =>
  !!p && SMARTLOANS_PRODUCTS.includes(p);

/** The SmartLoans product a session should run as: the active one when it is a
 * SmartLoans product, else the first one the account holds (null = none). */
export const smartLoansProductFor = (
  available: readonly ProductContext[],
  active: ProductContext | null,
): ProductContext | null => (isSmartLoansProduct(active) ? active : available.find(isSmartLoansProduct) ?? null);

/**
 * Where a signed-in session lands in SmartLoans: the active product when it is a
 * SmartLoans one, else the first SmartLoans product the account holds.
 * null = the account has no SmartLoans product (or no client record).
 */
export const smartLoansLanding = (
  available: readonly ProductContext[],
  active: ProductContext | null,
  clientId: number,
): string | null => {
  if (!clientId) return null;
  const product = smartLoansProductFor(available, active);
  return product ? productLandingRoute(product, clientId) : null;
};
