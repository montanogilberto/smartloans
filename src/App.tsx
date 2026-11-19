import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import PrivateRoute from './components/routing/PrivateRoute';
import LoginPage from './pages/authentication/LoginPage';
import InicioPage from './pages/session/InicioPage';
import PendingModulePage from './pages/session/PendingModulePage';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

// Dashboards are placeholders until each module is migrated from POSVending
// (docs/smartloans-repo-migration.md there).
const BorrowerDashboard = () => <PendingModulePage title="SmartLoans · Acreditado" />;
const LenderDashboard = () => <PendingModulePage title="SmartLoans · Prestamista" />;
const JuridicalDashboard = () => <PendingModulePage title="SmartLoans · Jurídico" />;

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/login" component={LoginPage} />
        <PrivateRoute exact path="/inicio" component={InicioPage} />
        <PrivateRoute exact path="/client-dashboard/:clientId" component={BorrowerDashboard} />
        <PrivateRoute exact path="/lender-dashboard/:clientId" component={LenderDashboard} />
        <PrivateRoute exact path="/juridical-dashboard/:clientId" component={JuridicalDashboard} />
        {/* Anything else (incl. POS landings like /dashboard or /rewards-dashboard
            that the shared login helpers may target) goes through /inicio. */}
        <Route render={() => <Redirect to="/inicio" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
