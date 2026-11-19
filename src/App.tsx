import { IonApp, IonPage, IonRouterOutlet, IonSplitPane, IonTabs, setupIonicReact } from '@ionic/react';
import BottomTabBar from './components/layout/BottomTabBar';
import SideMenu from './components/layout/SideMenu';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import PrivateRoute from './components/routing/PrivateRoute';
import LoginPage from './pages/authentication/LoginPage';
import InicioPage from './pages/session/InicioPage';
import EnrollmentPage from './pages/onboarding/EnrollmentPage';
import PendingModulePage from './pages/session/PendingModulePage';
import LenderDashboardPage from './pages/dashboard/LenderDashboardPage';
import MyLoansPage from './pages/loans/MyLoansPage';
import LoanDetailPage from './pages/loans/LoanDetailPage';
import NotificationsInboxPage from './pages/messaging/NotificationsInboxPage';
import NotificationDetailPage from './pages/messaging/NotificationDetailPage';
import ProfilePage from './pages/profile/ProfilePage';
import { ExitConfirmProvider } from './contexts/ExitConfirmContext';

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

// Dashboards not migrated from POSVending yet stay placeholders
// (docs/smartloans-repo-migration.md there).
const BorrowerDashboard = () => <PendingModulePage title="SmartLoans · Acreditado" />;
const JuridicalDashboard = () => <PendingModulePage title="SmartLoans · Jurídico" />;
// Bottom-tab and Header targets whose modules aren't migrated yet: a placeholder
// keeps the tab bar on screen instead of bouncing back to the dashboard.
const P2PLending = () => <PendingModulePage title="Invertir" />;
const Invite = () => <PendingModulePage title="Invitar" />;
const LoanChats = () => <PendingModulePage title="Chat" />;

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      {/* Inside the router, like POS: it uses useIonRouter for the back-button confirm. */}
      <ExitConfirmProvider>
        {/* Same shell as POS: the side menu is an overlay on phones and stays open
            beside the content from 792px up (where Header hides its menu button). */}
        <IonSplitPane contentId="main" when="(min-width: 792px)">
        <SideMenu />
        <IonPage id="main">
        {/* IonTabs only for its layout (page area + bottom slot), same as POS. */}
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/login" component={LoginPage} />
            <PrivateRoute exact path="/inicio" component={InicioPage} />
            <PrivateRoute exact path="/registro" component={EnrollmentPage} />
            <PrivateRoute exact path="/client-dashboard/:clientId" component={BorrowerDashboard} />
            <PrivateRoute exact path="/lender-dashboard/:clientId" component={LenderDashboardPage} />
            <PrivateRoute exact path="/juridical-dashboard/:clientId" component={JuridicalDashboard} />
            {/* Same two routes as POS: with the id (shareable, survives a refresh) and
                without it (old push deep links; MyLoans resolves the client from UserContext). */}
            <PrivateRoute exact path="/my-loans/:clientId" component={MyLoansPage} />
            <PrivateRoute exact path="/my-loans" component={MyLoansPage} />
            <PrivateRoute exact path="/loan-detail/:loanId" component={LoanDetailPage} />
            <PrivateRoute exact path="/p2p-lending/:clientId?" component={P2PLending} />
            <PrivateRoute exact path="/rewards" component={Invite} />
            <PrivateRoute exact path="/loan-chats" component={LoanChats} />
            <PrivateRoute exact path="/profile" component={ProfilePage} />
            <PrivateRoute exact path="/notifications" component={NotificationsInboxPage} />
            <PrivateRoute exact path="/notifications/detail/:pushNotificationId?" component={NotificationDetailPage} />
            {/* Anything else (incl. POS landings like /dashboard or /rewards-dashboard
                that the shared login helpers may target) goes through /inicio. */}
            <Route render={() => <Redirect to="/inicio" />} />
          </IonRouterOutlet>
          <BottomTabBar />
        </IonTabs>
        </IonPage>
        </IonSplitPane>
      </ExitConfirmProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
