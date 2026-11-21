import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useUser } from '../../contexts/UserContext';
import { API_BASE_URL, APP_ENV } from '../../utils/appEnv';
import { getAccessToken } from '../../utils/sessionTokens';
import { notifyDataChanged } from '../../utils/refreshBus';
import { notificationDetailRoute } from '../../utils/routes';
import type { NotificationTapState } from '../../pages/messaging/NotificationDetail/NotificationDetailTypes';

/**
 * Id de app con el que GMO Prestamos se registra en el Notification Hub
 * (tag `app_gmoprestamos`). El Hub es compartido con otras apps GMO: el backend
 * usa este tag para que los pushes de préstamos lleguen SOLO a esta app.
 */
export const PUSH_APP_ID = 'gmoprestamos';

const ANDROID_CHANNEL_ID = 'push_notifications';

/**
 * Registro de push + manejo de toques. Todo toque (app cerrada, en segundo
 * plano o banner en primer plano) abre la pantalla de detalle de la
 * notificación — nunca solo "abre la app" ni salta directo a la ruta.
 * Sin UI: va dentro del router porque navega con history.
 */
const PushNotificationsBootstrap: React.FC = () => {
  const history = useHistory();
  const { userId } = useUser();

  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    const handles: PluginListenerHandle[] = [];
    let cancelled = false;

    const openDetail = (
      notification: { title?: string; body?: string } | undefined,
      data: Record<string, unknown> | undefined,
      source: 'push' | 'local',
    ) => {
      const flat = Object.fromEntries(
        Object.entries(data ?? {}).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
      );
      const state: NotificationTapState = {
        title: notification?.title,
        body: notification?.body,
        data: flat,
        tappedAt: new Date().toISOString(),
        source,
      };
      const route = notificationDetailRoute(flat.pushNotificationId);
      console.log('[Push] tap →', JSON.stringify({ source, route }));
      history.push(route, state);
    };

    const setup = async () => {
      let permission = await PushNotifications.checkPermissions();
      if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted' || cancelled) return;

      // Android 8+: sin el canal, las notificaciones se descartan en silencio.
      // El backend (FCM) y el banner local apuntan a este mismo id.
      if (Capacitor.getPlatform() === 'android') {
        await PushNotifications.createChannel({
          id: ANDROID_CHANNEL_ID,
          name: 'GMO Prestamos',
          description: 'Préstamos, pagos y negociación',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibration: true,
        }).catch((e) => console.log('[Push] createChannel ❌', String(e)));
      }

      handles.push(await PushNotifications.addListener('registration', async (token) => {
        const platform = Capacitor.getPlatform();
        if (!getAccessToken()) {
          console.log('[Push] sin token de sesión, registro pendiente');
          return;
        }
        try {
          await fetch(`${API_BASE_URL}/registerDevice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token: token.value, platform, appEnv: APP_ENV, appId: PUSH_APP_ID }),
          });
          console.log('[Push] device registrado', JSON.stringify({ userId, platform, appEnv: APP_ENV, appId: PUSH_APP_ID }));
        } catch {
          // El registro no es crítico: se reintenta en el siguiente arranque.
        }
      }));

      handles.push(await PushNotifications.addListener('registrationError', (err) => {
        console.log('[Push] registrationError ❌', String(err?.error ?? err));
      }));

      handles.push(await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('[Push] recibida en foreground', JSON.stringify({ title: notification.title }));
        // Un push casi siempre significa que la contraparte movió dinero/datos.
        notifyDataChanged('push_received');
        // iOS ya la muestra (presentationOptions en capacitor.config): no duplicar.
        if (Capacitor.getPlatform() === 'ios') return;
        await LocalNotifications.schedule({
          notifications: [{
            // LocalNotifications exige int32: Date.now() lo desborda.
            id: Math.floor(Date.now() % 2147483647),
            title: notification.title ?? 'GMO Prestamos',
            body: notification.body ?? '',
            channelId: ANDROID_CHANNEL_ID,
            smallIcon: 'ic_launcher',
            extra: notification.data ?? {},
          }],
        }).catch((e) => console.log('[Push] banner local ❌', String(e)));
      }));

      // App cerrada / en segundo plano: toque en la notificación del sistema.
      handles.push(await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        openDetail(action.notification, action.notification?.data, 'push');
      }));

      // App en primer plano (Android): toque en el banner local de arriba.
      handles.push(await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        openDetail(action.notification, action.notification?.extra, 'local');
      }));

      if (!cancelled) await PushNotifications.register();
    };

    setup().catch((e) => console.log('[Push] setup ❌', String(e)));

    return () => {
      cancelled = true;
      handles.forEach((h) => h.remove());
    };
  }, [userId, history]);

  return null;
};

export default PushNotificationsBootstrap;
