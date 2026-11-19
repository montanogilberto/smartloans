import { createRoot } from 'react-dom/client';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from './App';
import { UserProvider } from './contexts/UserContext';
import { ObservabilityProvider } from './contexts/ObservabilityContext';
import { installObservabilityFetch } from './utils/observability';

// Before any request: stamps trace/identity headers and the session's Bearer
// token on backend calls, and refreshes the token on a 401.
installObservabilityFetch();

defineCustomElements(window);

// StrictMode intentionally off (same as POS): its dev double-mount conflicts
// with IonRouterOutlet's page-transition DOM handling.
createRoot(document.getElementById('root')!).render(
  <UserProvider>
    <ObservabilityProvider>
      <App />
    </ObservabilityProvider>
  </UserProvider>,
);
