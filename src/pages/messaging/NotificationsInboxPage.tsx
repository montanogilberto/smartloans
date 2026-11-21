/**
 * Mis notificaciones — per-user inbox behind the header bell.
 * The system push disappears after it's tapped/cleared; this page is the
 * persistent, trackable history (NotificationDeliveries), with unread
 * highlighting and tap-through to each notification's navigationRoute.
 *
 * Ported from POSVending with the same data flow; the markup moved to Ionic
 * items + NotificationsInboxPage.css (CLAUDE.md §4: no inline styles, no
 * clickable divs), the back button goes to the SmartLoans landing, and it also
 * reloads on onDataChanged (pushes / app resume, §6).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonRefresher, IonRefresherContent, IonIcon, IonBadge, IonItem, IonList,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  notificationsOutline, checkmarkCircleOutline, alertCircleOutline,
  informationCircleOutline, warningOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { canAccess } from '../../config/rolePermissions';
import Header from '../../components/layout/Header';
import AlertPopover from '../../components/popovers/AlertPopover';
import MailPopover from '../../components/popovers/MailPopover';
import PageLoading from '../../components/ui/PageLoading';
import EmptyState from '../../components/ui/EmptyState';
import {
  fetchMyNotifications, markNotificationsRead, InboxNotification,
} from '../../api/myNotificationsApi';
import { resolveNotificationRoute } from '../../utils/routes';
import { smartLoansLanding } from '../../utils/smartLoansLanding';
import { mxChatDate, mxChatTime } from '../../utils/format';
import { onDataChanged } from '../../utils/refreshBus';
import './NotificationsInboxPage.css';

const TYPE_ICON: Record<string, string> = {
  Success: checkmarkCircleOutline,
  Warning: warningOutline,
  Error: alertCircleOutline,
  Info: informationCircleOutline,
};
const KNOWN_TYPES = Object.keys(TYPE_ICON);

const NotificationsInboxPage: React.FC = () => {
  const history = useHistory();
  const { userId, roleCode, clientId, companyId, availableProducts, activeProduct } = useUser();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAlert, setShowAlert] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [popEvent, setPopEvent] = useState<React.MouseEvent | undefined>();

  const load = useCallback(async (markAll = false) => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { notifications } = await fetchMyNotifications(userId, { companyId, clientId });
      setItems(notifications);
      if (markAll && notifications.some(n => !n.isRead)) {
        // Reading the inbox counts as reading the notifications — clears the
        // badge; unread styling on THIS render still shows what was new.
        markNotificationsRead(userId, undefined, { companyId, clientId }).catch(() => {});
      }
    } catch (e) {
      console.log('[Inbox] load ❌', String(e));
    }
    setLoading(false);
  }, [userId, companyId, clientId]);

  useIonViewWillEnter(() => { load(true); }, [load]);
  useEffect(() => onDataChanged(() => { load(); }), [load]);

  const open = (n: InboxNotification) => {
    // Remapeo de rutas de staff + clientId del lector (las rutas guardadas
    // vienen sin él: el emisor no lo conoce).
    const route = resolveNotificationRoute(n.navigationRoute, canAccess(roleCode, 'clients'), clientId);
    console.log('[Inbox] open →', n.pushNotificationId, route ?? '(sin ruta)');
    if (route) history.push(route);
  };

  return (
    <IonPage>
      <Header
        screenTitle="Mis notificaciones"
        showBackButton={true}
        backButtonHref={smartLoansLanding(availableProducts, activeProduct, clientId) ?? '/inicio'}
        presentAlertPopover={(e) => { setPopEvent(e); setShowAlert(true); }}
        presentMailPopover={(e) => { setPopEvent(e); setShowMail(true); }}
      />
      <AlertPopover isOpen={showAlert} event={popEvent as any} onDidDismiss={() => setShowAlert(false)} />
      <MailPopover isOpen={showMail} event={popEvent as any} onDidDismiss={() => setShowMail(false)} />
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={(e) => { load().then(() => e.detail.complete()); }}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && items.length === 0 && (
          <PageLoading text="Cargando tus notificaciones…" />
        )}

        {!loading && items.length === 0 && (
          <EmptyState icon={notificationsOutline} text="Sin notificaciones todavía." />
        )}

        {items.length > 0 && (
          <IonList lines="none" className="inbox-list">
            {items.map(n => {
              const type = KNOWN_TYPES.includes(n.notificationType ?? '') ? n.notificationType! : 'Info';
              return (
                <IonItem
                  key={n.notificationDeliveryId}
                  button={!!n.navigationRoute}
                  detail={!!n.navigationRoute}
                  onClick={n.navigationRoute ? () => open(n) : undefined}
                  className={`inbox-item${n.isRead ? '' : ' inbox-item--unread'}`}
                >
                  <IonIcon
                    slot="start"
                    icon={TYPE_ICON[type]}
                    className={`inbox-icon inbox-icon--${type.toLowerCase()}`}
                    aria-hidden="true"
                  />
                  <div className="inbox-body">
                    <div className="inbox-title-row">
                      <strong className="inbox-title">{n.title}</strong>
                      {!n.isRead && <IonBadge color="primary" className="inbox-badge">nueva</IonBadge>}
                    </div>
                    <p className="inbox-message">{n.message}</p>
                    <span className="inbox-date">{mxChatDate(n.receivedAt)} · {mxChatTime(n.receivedAt)}</span>
                  </div>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default NotificationsInboxPage;
