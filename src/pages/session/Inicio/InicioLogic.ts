import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { smartLoansLanding } from '../../../utils/smartLoansLanding';

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
    companyId, clientId, clientCapabilitiesKey, availableProducts, activeProduct, logout, refreshCapabilities,
  } = useUser();
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const capabilitiesLoaded = !clientId || clientCapabilitiesKey === `${companyId}:${clientId}`;
  const landing = smartLoansLanding(availableProducts, activeProduct, clientId);

  useEffect(() => {
    if (landing) history.replace(landing);
    else if (capabilitiesLoaded) history.replace(ENROLLMENT_ROUTE);
  }, [landing, capabilitiesLoaded]);

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
