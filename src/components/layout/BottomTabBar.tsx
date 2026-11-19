import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  homeOutline, documentTextOutline, cardOutline, barChart, peopleOutline, chatbubblesOutline,
  walletOutline, pulseOutline, personCircleOutline, speedometerOutline, briefcaseOutline, cashOutline,
} from 'ionicons/icons';
import { useUser } from '../../contexts/UserContext';
import { actsAsBorrower, actsAsLender } from '../../utils/productContext';
import { myLoansRoute, p2pLendingRoute } from '../../utils/routes';
import './BottomTabBar.css';

interface Tab { id: string; label: string; icon: string; to: string }

/**
 * Bottom nav — same tabs, targets and active-tab rules as POSVending's App.tsx
 * shell, one set per product. IonButtons instead of POS's raw <button>s
 * (CLAUDE.md §4); the .cd-tabbar / .cd-tab look comes from theme/variables.css.
 *
 * Lender: Inicio / Préstamos / Pagos / Invertir / Invitar / Chat. "Pagos" is a
 * section of the lender dashboard (?section=pagos, it scrolls there).
 * Borrower: Home / Préstamos / Pagos / Actividad / Perfil / Chat. The first five
 * are ?tab= sections of the ONE borrower dashboard route, so the active tab is
 * read from the query string (IonTabs matches by path only).
 * Juridical: Inicio / Perfil, the small bar POS gives own-dashboard products.
 * Admin: Resumen / Préstamos / Acreditados / Prestamistas / Jurídico / KPI.
 */
const BottomTabBar: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { isAuthenticated, roleCode, activeProduct, clientId } = useUser();

  if (!isAuthenticated) return null;
  const isAdmin = activeProduct === 'admin';
  const isLender = actsAsLender(roleCode, activeProduct);
  const isBorrower = !isLender && actsAsBorrower(roleCode, activeProduct);
  const isJuridical = !isLender && !isBorrower && activeProduct === 'juridical';
  if (!isAdmin && !isLender && !isBorrower && !isJuridical) return null;

  const { pathname } = location;
  const query = new URLSearchParams(location.search);
  const onChat = pathname.startsWith('/loan-chat');

  let tabs: Tab[];
  let active: string;

  if (isAdmin) {
    // /admin/:section — anything else opened from the admin (a loan, a client's
    // dashboard) keeps the tab it was opened from highlighted by its path.
    const section = pathname.startsWith('/admin') ? (pathname.split('/')[2] || 'resumen') : '';
    active = section === 'proposals' ? 'loans'
      : pathname.startsWith('/loan-detail') ? 'loans'
      : section;
    tabs = [
      { id: 'resumen', label: 'Resumen', icon: speedometerOutline, to: '/admin' },
      { id: 'loans', label: 'Préstamos', icon: documentTextOutline, to: '/admin/loans' },
      { id: 'borrowers', label: 'Acreditados', icon: walletOutline, to: '/admin/borrowers' },
      { id: 'lenders', label: 'Prestamistas', icon: cashOutline, to: '/admin/lenders' },
      { id: 'juridical', label: 'Jurídico', icon: briefcaseOutline, to: '/admin/juridical' },
      { id: 'kpi', label: 'KPI', icon: barChart, to: '/admin/kpi' },
    ];
  } else if (isLender) {
    const section = query.get('section');
    active = onChat ? 'chat'
      : pathname.startsWith('/p2p-lending') ? 'invertir'
      : pathname.startsWith('/rewards') ? 'invitar'
      // A loan's detail is reached from Préstamos (POS left it on Inicio).
      : pathname.startsWith('/my-loans') || pathname.startsWith('/loan-detail') ? 'prestamos'
      : section === 'pagos' ? 'pagos'
      : 'inicio';
    tabs = [
      { id: 'inicio', label: 'Inicio', icon: homeOutline, to: `/lender-dashboard/${clientId}` },
      { id: 'prestamos', label: 'Préstamos', icon: documentTextOutline, to: myLoansRoute(clientId) },
      { id: 'pagos', label: 'Pagos', icon: cardOutline, to: `/lender-dashboard/${clientId}?section=pagos` },
      { id: 'invertir', label: 'Invertir', icon: barChart, to: p2pLendingRoute(clientId) },
      { id: 'invitar', label: 'Invitar', icon: peopleOutline, to: '/rewards' },
      { id: 'chat', label: 'Chat', icon: chatbubblesOutline, to: '/loan-chats' },
    ];
  } else if (isJuridical) {
    active = pathname.startsWith('/juridical-dashboard') ? 'inicio'
      : pathname.startsWith('/profile') ? 'perfil'
      : '';
    tabs = [
      { id: 'inicio', label: 'Inicio', icon: homeOutline, to: `/juridical-dashboard/${clientId}` },
      { id: 'perfil', label: 'Perfil', icon: personCircleOutline, to: '/profile' },
    ];
  } else {
    const dashboard = `/client-dashboard/${clientId}`;
    const onDashboard = pathname.startsWith('/client-dashboard');
    active = onChat ? 'chat'
      : onDashboard ? (query.get('tab') || 'home')
      // A loan's detail / the loans list belong under Préstamos.
      : pathname.startsWith('/loan-detail') || pathname.startsWith('/my-loans') ? 'loans'
      : pathname.startsWith('/payment') ? 'payments'
      : '';
    tabs = [
      { id: 'home', label: 'Home', icon: homeOutline, to: `${dashboard}?tab=home` },
      { id: 'loans', label: 'Préstamos', icon: walletOutline, to: `${dashboard}?tab=loans` },
      { id: 'payments', label: 'Pagos', icon: cardOutline, to: `${dashboard}?tab=payments` },
      { id: 'activity', label: 'Actividad', icon: pulseOutline, to: `${dashboard}?tab=activity` },
      { id: 'profile', label: 'Perfil', icon: personCircleOutline, to: `${dashboard}?tab=profile` },
      { id: 'chat', label: 'Chat', icon: chatbubblesOutline, to: '/loan-chats' },
    ];
  }

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
