import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  homeOutline, documentTextOutline, cardOutline, barChart, peopleOutline, chatbubblesOutline,
} from 'ionicons/icons';
import { useUser } from '../../contexts/UserContext';
import { actsAsLender } from '../../utils/productContext';
import { myLoansRoute, p2pLendingRoute } from '../../utils/routes';
import './BottomTabBar.css';

type LenderTab = 'inicio' | 'prestamos' | 'pagos' | 'invertir' | 'invitar' | 'chat';

/**
 * Lender bottom nav — same tabs, targets and active-tab rules as POSVending's
 * App.tsx shell (Inicio / Préstamos / Pagos / Invertir / Invitar / Chat).
 * "Pagos" is a section of the lender dashboard (?section=pagos, the dashboard
 * scrolls to it); the others are routes. IonButtons instead of POS's raw
 * <button>s (CLAUDE.md §4); the .cd-tabbar / .cd-tab look comes from
 * theme/variables.css. Renders nothing for other sessions — the borrower bar
 * arrives with the borrower dashboard.
 */
const BottomTabBar: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { isAuthenticated, roleCode, activeProduct, clientId } = useUser();

  if (!isAuthenticated || !actsAsLender(roleCode, activeProduct)) return null;

  const section = new URLSearchParams(location.search).get('section');
  const active: LenderTab =
    location.pathname.startsWith('/loan-chat') ? 'chat'
      : location.pathname.startsWith('/p2p-lending') ? 'invertir'
      : location.pathname.startsWith('/rewards') ? 'invitar'
      // A loan's detail is reached from Préstamos (POS left it on Inicio).
      : location.pathname.startsWith('/my-loans') || location.pathname.startsWith('/loan-detail') ? 'prestamos'
      : section === 'pagos' ? 'pagos'
      : 'inicio';

  const tabs: { id: LenderTab; label: string; icon: string; to: string }[] = [
    { id: 'inicio', label: 'Inicio', icon: homeOutline, to: `/lender-dashboard/${clientId}` },
    { id: 'prestamos', label: 'Préstamos', icon: documentTextOutline, to: myLoansRoute(clientId) },
    { id: 'pagos', label: 'Pagos', icon: cardOutline, to: `/lender-dashboard/${clientId}?section=pagos` },
    { id: 'invertir', label: 'Invertir', icon: barChart, to: p2pLendingRoute(clientId) },
    { id: 'invitar', label: 'Invitar', icon: peopleOutline, to: '/rewards' },
    { id: 'chat', label: 'Chat', icon: chatbubblesOutline, to: '/loan-chats' },
  ];

  return (
    <nav slot="bottom" className="cd-tabbar" aria-label="Navegación">
      {tabs.map(tab => (
        <IonButton
          key={tab.id}
          fill="clear"
          className={`cd-tab${active === tab.id ? ' cd-tab--active' : ''}`}
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => history.push(tab.to)}
        >
          <span className="cd-tab-inner">
            <IonIcon aria-hidden="true" icon={tab.icon} />
            <span>{tab.label}</span>
          </span>
        </IonButton>
      ))}
    </nav>
  );
};

export default BottomTabBar;
