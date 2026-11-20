import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { smartLoansLanding, smartLoansProductFor } from '../../../utils/smartLoansLanding';

const LOAD_TIMEOUT_MS = 10000;

/** Where an account without a SmartLoans product chooses acreditado / prestamista / jurídico. */
export const ENROLLMENT_ROUTE = '/registro';

/** What /inicio shows while it decides where the session goes. */
export type InicioState = 'loading' | 'load-failed';

/**
 * Sends the session to its SmartLoans dashboard as soon as one is known (from
 * the role, or from the clientCapabilities UserContext fetches after login).
 * An account with none (e.g. a POS / Rewards customer) starts registration.
 */
export function useInicio() {
  const history = useHistory();
  const {
    companyId, clientId, clientCapabilitiesKey, cellphoneClientId, availableProducts, activeProduct, setActiveProduct, logout, refreshCapabilities,
  } = useUser();
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // The client's phone decides the platform admin (UserContext): wait for it too,
  // or the admin would land on another dashboard first. A failed read gives up
  // after the timeout and lands without the admin product.
  const phoneLoaded = !clientId || cellphoneClientId === clientId || timedOut;
  const capabilitiesLoaded = phoneLoaded && (!clientId || clientCapabilitiesKey === `${companyId}:${clientId}`);
  const landing = smartLoansLanding(availableProducts, activeProduct, clientId);

  // A POS/Rewards account (roleCode 'pos') starts with activeProduct 'pos'. Switch
  // the session to the SmartLoans product it lands on — the tab bar, side menu
  // and Header all read activeProduct, not the URL.
  const product = smartLoansProductFor(availableProducts, activeProduct);

  useEffect(() => {
    if (!phoneLoaded) return;
    if (product && product !== activeProduct) {
      console.log('[Inicio] active product', activeProduct, '→', product);
      setActiveProduct(product);
    }
    if (landing) history.replace(landing);
    else if (capabilitiesLoaded) history.replace(ENROLLMENT_ROUTE);
  }, [landing, capabilitiesLoaded, phoneLoaded, product, activeProduct]);

  useEffect(() => {
    if (capabilitiesLoaded) return;
    const t = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [capabilitiesLoaded]);

  const retry = async () => {
    setRetrying(true);
    try {
      await refreshCapabilities();
      setTimedOut(false);
    } catch (err) {
      console.warn('[Inicio] refreshCapabilities failed:', err);
    } finally {
      setRetrying(false);
    }
  };

  const signOut = () => {
    logout();
    history.replace('/login');
  };

  // Loaded capabilities always redirect (dashboard or registration), so only a
  // load that timed out stays on this page.
  const state: InicioState = !capabilitiesLoaded && timedOut && !landing ? 'load-failed' : 'loading';

  return { state, retrying, retry, signOut };
}

export type InicioVM = ReturnType<typeof useInicio>;
