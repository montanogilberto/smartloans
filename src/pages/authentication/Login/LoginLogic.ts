import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useToast } from '../../../hooks/useToast';
import { fetchUserProfile, parseUserId, postLogin } from '../../../api/usersApi';
import { normalizeRoleCode } from '../../../config/rolePermissions';
import { DEFAULT_AVATAR_URL } from '../../../utils/formatters';
import {
  isBiometricAvailable, isBiometricLockEnabled, setBiometricLockEnabled, authenticateBiometric,
} from '../../../utils/biometricAuth';
import { useClientPhoneLogin } from './components/ClientPhoneLoginLogic';

/** After any sign-in the session goes to /inicio, which picks the SmartLoans dashboard. */
export const POST_LOGIN_ROUTE = '/inicio';

/** 'phone' (SMS → PIN → biometric) is the main path; 'password' is for accounts with a username. */
export type LoginMode = 'phone' | 'password';

/**
 * SmartLoans sign-in. Reuses the POS phone flow (useClientPhoneLogin) and the
 * username/password call (/login) without the POS-only steps: no app picker,
 * no company selector, no cash-register opening.
 */
export function useLogin() {
  const history = useHistory();
  const { login, isAuthenticated } = useUser();
  const phone = useClientPhoneLogin('smartloans');
  const { showToast, toastProps } = useToast({ defaultColor: 'danger', duration: 3500 });

  const [mode, setMode] = useState<LoginMode>('phone');
  const usernameRef = useRef('');
  const passwordRef = useRef('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Already signed in on this device → skip the form.
  useEffect(() => {
    if (isAuthenticated) history.replace(POST_LOGIN_ROUTE);
  }, []);

  useEffect(() => {
    (async () => {
      const [available, enabled] = await Promise.all([isBiometricAvailable(), isBiometricLockEnabled()]);
      setBiometricSupported(available);
      setBiometricEnabled(available && enabled);
    })();
  }, []);

  const toggleBiometric = async (next: boolean) => {
    if (next && !(await authenticateBiometric('Confirma tu identidad para activar el bloqueo biométrico'))) return;
    await setBiometricLockEnabled(next);
    setBiometricEnabled(next);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = usernameRef.current.trim();
    const password = passwordRef.current;
    if (!username || !password) {
      showToast('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const result = await postLogin(username, password);
      const msg = result?.msg ?? '';
      if (!result || msg.toLowerCase().includes('invalid')) {
        showToast('Usuario o contraseña incorrectos');
        return;
      }
      if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('inactive')) {
        showToast(msg);
        return;
      }

      const userId = parseUserId(result.userId);
      if (!userId) {
        showToast('No se recibió el ID de usuario del servidor');
        return;
      }

      // /login returns userId only — name and photo come from /one_users.
      let displayName = username;
      let avatarUrl = DEFAULT_AVATAR_URL;
      try {
        const profile = await fetchUserProfile(userId);
        if (profile?.name) displayName = profile.name;
        if (profile?.avatarUrl) avatarUrl = profile.avatarUrl;
      } catch (profileErr) {
        console.warn('[Login] one_users profile failed:', profileErr);
      }

      const roleCode = normalizeRoleCode(result.roleCode);
      login({
        userId,
        username: displayName,
        avatarUrl,
        companyId: parseUserId(result.companyId),
        companyName: '',
        branchId: parseUserId(result.branchId),
        branchName: '',
        clientId: parseUserId(result.clientId),
        roleCode,
        roleName: result.roleName?.trim() || roleCode,
      });
      history.push(POST_LOGIN_ROUTE);
    } catch (err) {
      showToast(`Error al iniciar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode, setMode, phone,
    usernameRef, passwordRef, showPassword, setShowPassword,
    loading, toastProps, submitPassword,
    biometricSupported, biometricEnabled, toggleBiometric,
  };
}

export type LoginVM = ReturnType<typeof useLogin>;
