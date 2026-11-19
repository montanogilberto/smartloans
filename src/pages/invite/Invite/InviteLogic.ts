import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { useUser } from '../../../contexts/UserContext';
import { useToast } from '../../../hooks/useToast';
import { INVITE_TITLE, SMARTLOANS_PLAY_STORE_URL, buildInviteMessage } from './InviteConstants';

/**
 * Native → @capacitor/clipboard (WebViews may refuse navigator.clipboard).
 * Web → navigator.clipboard, and when the browser refuses it (no permission,
 * embedded frame) the legacy hidden-textarea + execCommand('copy').
 */
async function copyText(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text });
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch { /* fall through to the legacy path */ }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'invite-copy-buffer';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  if (!ok) throw new Error('execCommand copy refused');
}

/**
 * Invitar — shares a download invite through the phone's share sheet.
 * No referral tracking: nothing is written to the backend (there is no
 * referral program yet; that would be a factory PRD). Native → @capacitor/share;
 * web → navigator.share when the browser has it, else copy to the clipboard.
 */
export function useInvite() {
  const { username } = useUser();
  const { showToast, toastProps } = useToast({ duration: 2500 });
  const [sharing, setSharing] = useState(false);
  const message = buildInviteMessage(username);

  const copy = async () => {
    try {
      await copyText(message);
      showToast('Invitación copiada. Pégala en WhatsApp o SMS.', 'success');
    } catch (err) {
      console.log('[Invite] copy ❌', String((err as Error)?.message ?? err));
      showToast('No se pudo copiar la invitación.', 'danger');
    }
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const { value: canShare } = await Share.canShare();
      console.log('[Invite] share → canShare =', canShare);
      if (canShare) {
        await Share.share({ title: INVITE_TITLE, text: message, url: SMARTLOANS_PLAY_STORE_URL, dialogTitle: 'Invitar a GMO Prestamos' });
      } else {
        await copy();
      }
    } catch (err) {
      // Closing the share sheet without picking an app rejects too — not an error for the user.
      const msg = String((err as Error)?.message ?? err);
      if (!/cancel|abort/i.test(msg)) {
        console.log('[Invite] share ❌', msg);
        await copy();
      }
    } finally {
      setSharing(false);
    }
  };

  return { message, sharing, share, copy, toastProps };
}

export type InviteVM = ReturnType<typeof useInvite>;
