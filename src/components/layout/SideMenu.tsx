import React, { useCallback, useEffect, useState } from 'react';
import {
  IonAvatar, IonBadge, IonContent, IonFooter, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
  IonMenu, IonMenuToggle, IonTitle, IonToolbar, useIonAlert,
} from '@ionic/react';
import {
  addCircleOutline, briefcaseOutline, cashOutline, checkmarkCircle, chatbubblesOutline, logOutOutline, notificationsOutline, personCircleOutline, sparklesOutline, walletOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { PRODUCT_LABELS, ProductContext, productLandingRoute } from '../../utils/productContext';
import { SMARTLOANS_PRODUCTS, isSmartLoansProduct } from '../../utils/smartLoansLanding';
import { DEFAULT_AVATAR_URL } from '../../utils/formatters';
import { fetchMyNotifications } from '../../api/myNotificationsApi';
import { getChatConfig } from '../../api/loanChatApi';
import { onDataChanged } from '../../utils/refreshBus';
import './SideMenu.css';

const PRODUCT_ICONS: Partial<Record<ProductContext, string>> = {
  borrower: walletOutline, lender: cashOutline, juridical: briefcaseOutline,
};

/**
 * SmartLoans side menu — the lean version of POSVending's AppShell menu: profile
 * header, the SmartLoans products this account holds (switch between them), a
 * way to add another one (/registro), Mensajes (the customer's own inbox — POS's
 * Mensajes items are admin/manager back-office tools), and Cerrar sesión with the same confirm
 * alert as POS. POS-only sections (catálogos, finanzas, POS products…) don't
 * exist here. menuId "main-menu" is what the shared Header's IonMenuButton opens.
 */
const SideMenu: React.FC = () => {
  const history = useHistory();
  const {
    isAuthenticated, userId, username, avatarUrl, clientId, availableProducts, activeProduct, setActiveProduct, logout,
  } = useUser();
  const [unread, setUnread] = useState(0);

  // Unread badge: refreshed when the menu opens and on any data-changed broadcast
  // (pushes, app resume, the inbox marking everything read).
  const loadUnread = useCallback(() => {
    if (!isAuthenticated || !userId) { setUnread(0); return; }
    fetchMyNotifications(userId).then(r => setUnread(r.unreadCount)).catch(() => {});
  }, [isAuthenticated, userId]);
  useEffect(() => { loadUnread(); return onDataChanged(loadUnread); }, [loadUnread]);

  // Customer-facing agent: the GMO Prestamos assistant (same chat the Header's ✨
  // opens). 0 = assistant not configured → the entry is hidden. Staff agent tools
  // (Agente WhatsApp, Agentes IA) stay in POS (migration decision D2).
  const [agentClientId, setAgentClientId] = useState(0);
  useEffect(() => {
    if (!isAuthenticated) return;
    getChatConfig().then(c => setAgentClientId(c.agentEnabled ? c.agentClientId : 0)).catch(() => {});
  }, [isAuthenticated]);
  const [presentAlert] = useIonAlert();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const products = availableProducts.filter(isSmartLoansProduct);
  const canAddProduct = products.length < SMARTLOANS_PRODUCTS.length;

  const switchProduct = (product: ProductContext) => {
    console.log('[SideMenu] switching product →', product);
    setActiveProduct(product);
    history.push(productLandingRoute(product, clientId));
  };

  const handleLogout = () => {
    presentAlert({
      header: 'Cerrar sesión',
      message: '¿Deseas cerrar la sesión o continuar?',
      buttons: [
        { text: 'Continuar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            logout();
            history.replace('/login');
          },
        },
      ],
    });
  };

  return (
    // Disabled while signed out: no swipe-open on /login, and the split pane hides it.
    <IonMenu menuId="main-menu" contentId="main" side="start" disabled={!isAuthenticated} onIonWillOpen={loadUnread}>
      <IonHeader className="menu-header">
        <IonToolbar>
          <IonTitle>GMO Prestamos</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="profile-header">
          <IonAvatar className="profile-avatar">
            <img
              src={avatarSrc ?? (avatarUrl || DEFAULT_AVATAR_URL)}
              alt="Foto de perfil"
              onError={() => setAvatarSrc(DEFAULT_AVATAR_URL)}
            />
          </IonAvatar>
          <div className="profile-info">
            <h3 className="profile-name">{username || 'Usuario'}</h3>
            <p className="profile-role">
              {activeProduct && isSmartLoansProduct(activeProduct) ? PRODUCT_LABELS[activeProduct] : 'GMO Prestamos'}
            </p>
          </div>
        </div>

        <IonList>
          <IonListHeader className="side-menu-section">Mis productos</IonListHeader>
          {products.map(product => (
            <IonMenuToggle autoHide={false} key={product}>
              <IonItem
                button
                detail={false}
                onClick={() => switchProduct(product)}
                className={product === activeProduct ? 'side-menu-item--active' : undefined}
              >
                <IonIcon icon={PRODUCT_ICONS[product]} slot="start" />
                <IonLabel>{PRODUCT_LABELS[product]}</IonLabel>
                {product === activeProduct && <IonIcon icon={checkmarkCircle} slot="end" color="primary" />}
              </IonItem>
            </IonMenuToggle>
          ))}
          {canAddProduct && (
            <IonMenuToggle autoHide={false}>
              <IonItem button detail={false} routerLink="/registro">
                <IonIcon icon={addCircleOutline} slot="start" />
                <IonLabel>Agregar producto</IonLabel>
              </IonItem>
            </IonMenuToggle>
          )}

          <IonListHeader className="side-menu-section">Agentes</IonListHeader>
          {agentClientId > 0 && (
            <IonMenuToggle autoHide={false}>
              <IonItem button detail={false} routerLink={`/loan-chat/new?lenderId=${agentClientId}`}>
                <IonIcon icon={sparklesOutline} slot="start" />
                <IonLabel>Asistente GMO Prestamos</IonLabel>
              </IonItem>
            </IonMenuToggle>
          )}
          <IonMenuToggle autoHide={false}>
            <IonItem button detail={false} routerLink="/loan-chats">
              <IonIcon icon={chatbubblesOutline} slot="start" />
              <IonLabel>Mis conversaciones</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonListHeader className="side-menu-section">Mensajes</IonListHeader>
          <IonMenuToggle autoHide={false}>
            <IonItem button detail={false} routerLink="/notifications">
              <IonIcon icon={notificationsOutline} slot="start" />
              <IonLabel>Mis notificaciones</IonLabel>
              {unread > 0 && <IonBadge slot="end" color="danger">{unread}</IonBadge>}
            </IonItem>
          </IonMenuToggle>

          <IonListHeader className="side-menu-section">Cuenta</IonListHeader>
          <IonMenuToggle autoHide={false}>
            <IonItem button detail={false} routerLink="/profile">
              <IonIcon icon={personCircleOutline} slot="start" />
              <IonLabel>Mi perfil</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>

      <IonFooter className="menu-footer">
        <IonMenuToggle autoHide={false}>
          <IonItem button detail={false} onClick={handleLogout}>
            <IonIcon icon={logOutOutline} slot="start" color="danger" />
            <IonLabel color="danger">Cerrar sesión</IonLabel>
          </IonItem>
        </IonMenuToggle>
      </IonFooter>
    </IonMenu>
  );
};

export default SideMenu;
