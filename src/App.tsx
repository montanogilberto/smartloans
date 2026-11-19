import { IonApp, IonPage, IonRouterOutlet, IonSplitPane, IonTabs, setupIonicReact } from '@ionic/react';
import BottomTabBar from './components/layout/BottomTabBar';
import SideMenu from './components/layout/SideMenu';
import { IonReactRouter } from '@ionic/react-router';
import React, { Suspense, lazy, useEffect } from 'react';
import { Route, useHistory } from 'react-router-dom';
import PrivateRoute from './components/routing/PrivateRoute';
import LoginPage from './pages/authentication/LoginPage';
import InicioPage from './pages/session/InicioPage';
import EnrollmentPage from './pages/onboarding/EnrollmentPage';
import LenderDashboardPage from './pages/dashboard/LenderDashboardPage';
import MyLoansPage from './pages/loans/MyLoansPage';
import LoanDetailPage from './pages/loans/LoanDetailPage';
import NotificationsInboxPage from './pages/messaging/NotificationsInboxPage';
import NotificationDetailPage from './pages/messaging/NotificationDetailPage';
import ProfilePage from './pages/profile/ProfilePage';
import P2PLendingPage from './pages/loans/P2PLendingPage';
import LoanChatPage from './pages/loans/LoanChatPage';
import JuridicalDashboardPage from './pages/juridical/JuridicalDashboardPage';
import InvitePage from './pages/invite/InvitePage';
import AdminPage from './pages/admin/AdminPage';
import ClientDashboardPage from './pages/clients/ClientDashboardPage';
import BorrowerOnboardingPage from './pages/loans/BorrowerOnboardingPage';
import LoanPaymentPage from './pages/loans/LoanPaymentPage';
import { useUser } from './contexts/UserContext';
import LoanChatListPage from './pages/loans/LoanChatListPage';
import ExpedienteDigitalPage from './pages/clients/ExpedienteDigitalPage';
import PageLoading from './components/ui/PageLoading';

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

// KYC loads face-api (~13 MB of models fetched at capture time) — split into its
// own chunk like POS. The Suspense lives INSIDE the page component: a bare
// <Suspense> child of IonRouterOutlet has no path, and Ionic treats a path-less
// child as the default route (the same trap as the old catch-all).
const ClientFaceRecognitionLazy = lazy(() => import('./pages/clients/ClientFaceRecognitionPage'));
const ClientFaceRecognitionPage: React.FC = () => (
  <Suspense fallback={<PageLoading text="Cargando verificación…" />}>
    <ClientFaceRecognitionLazy />
  </Suspense>
);

// Paths with no page here — the root and the POS landings the shared helpers may
// target (getPostLoginRoute, productLandingRoute) — go to /inicio. Listed one by
// one on purpose: never a pathless catch-all. Once visited, IonRouterOutlet keeps
// its view, and getChildrenToRender re-syncs a path-less view to whatever route
// child it matches — it rendered LenderDashboard under the catch-all's empty match,
// so useParams() had no clientId (NaN) after phone login went through /rewards-dashboard.
const ToInicio: React.FC = () => {
  const history = useHistory();
  useEffect(() => { history.replace('/inicio'); }, [history]);
  return null;
};

// /client-face-recognition (singular) is what BorrowerOnboarding and Mi perfil push,
// but POS never had that route. Alias it to the real KYC page with the signed-in
// client, the same state the dashboards pass, instead of editing the copied callers.
const ToIdentityVerification: React.FC = () => {
  const history = useHistory();
  const { clientId } = useUser();
  useEffect(() => {
    history.replace('/clientFaceRecognitions', { clientId, continueToPayments: true });
  }, [history, clientId]);
  return null;
};

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
            <PrivateRoute exact path="/client-dashboard/:clientId" component={ClientDashboardPage} />
            <PrivateRoute exact path="/lender-dashboard/:clientId" component={LenderDashboardPage} />
            <PrivateRoute exact path="/juridical-dashboard/:clientId" component={JuridicalDashboardPage} />
            {/* Same two routes as POS: with the id (shareable, survives a refresh) and
                without it (old push deep links; MyLoans resolves the client from UserContext). */}
            <PrivateRoute exact path="/my-loans/:clientId" component={MyLoansPage} />
            <PrivateRoute exact path="/my-loans" component={MyLoansPage} />
            <PrivateRoute exact path="/loan-detail/:loanId" component={LoanDetailPage} />
            {/* Same two routes as POS: with the client id and without it (P2P resolves it from UserContext). */}
            <PrivateRoute exact path="/p2p-lending/:clientId" component={P2PLendingPage} />
            <PrivateRoute exact path="/p2p-lending" component={P2PLendingPage} />
            <PrivateRoute exact path="/loan-chat/:conversationId" component={LoanChatPage} />
            <PrivateRoute exact path="/payment" component={LoanPaymentPage} />
            <PrivateRoute exact path="/borrower-onboarding" component={BorrowerOnboardingPage} />
            <PrivateRoute exact path="/client-face-recognition" component={ToIdentityVerification} />
            <PrivateRoute exact path="/clientFaceRecognitions" component={ClientFaceRecognitionPage} />
            <PrivateRoute exact path="/client-expediente/:clientId" component={ExpedienteDigitalPage} />
            {/* GMO Prestamos platform admin (one phone — config/appCompany.ts). */}
            <PrivateRoute exact path="/admin/:section?" component={AdminPage} />
            <PrivateRoute exact path="/rewards" component={InvitePage} />
            <PrivateRoute exact path="/loan-chats" component={LoanChatListPage} />
            <PrivateRoute exact path="/profile" component={ProfilePage} />
            <PrivateRoute exact path="/notifications" component={NotificationsInboxPage} />
            <PrivateRoute exact path="/notifications/detail/:pushNotificationId?" component={NotificationDetailPage} />
            <Route exact path="/" component={ToInicio} />
            <Route exact path="/dashboard" component={ToInicio} />
            <Route exact path="/rewards-dashboard/:clientId" component={ToInicio} />
            <Route exact path="/factory-dashboard/:clientId" component={ToInicio} />
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
