import React from 'react';
import {
  IonButton, IonCol, IonContent, IonGrid, IonIcon, IonInput, IonLabel, IonPage, IonRow, IonSpinner,
  IonToast, IonToggle,
} from '@ionic/react';
import {
  eye, eyeOff, fingerPrintOutline, lockClosedOutline, logInOutline, personOutline, callOutline,
} from 'ionicons/icons';
import ClientPhoneLoginCard from './components/ClientPhoneLoginCard';
import { SMARTLOANS_MARK_SRC } from './LoginConstants';
import { useLogin, LoginVM } from './LoginLogic';

const PasswordForm: React.FC<{ vm: LoginVM }> = ({ vm }) => (
  <>
    <h2 className="login-card-title">Iniciar sesión</h2>
    <p className="login-card-subtitle">Entra con tu usuario y contraseña</p>

    <form onSubmit={vm.submitPassword} className="login-form">
      <div className="login-field">
        <IonLabel className="login-label login-label--icon">
          <IonIcon icon={personOutline} aria-hidden="true" /> Usuario
        </IonLabel>
        <IonInput
          type="text"
          placeholder="Ingresa tu usuario"
          onIonInput={e => { vm.usernameRef.current = e.detail.value ?? ''; }}
          className="login-input"
          autocomplete="username"
        />
      </div>

      <div className="login-field">
        <IonLabel className="login-label login-label--icon">
          <IonIcon icon={lockClosedOutline} aria-hidden="true" /> Contraseña
        </IonLabel>
        <div className="login-password-wrapper">
          <IonInput
            type={vm.showPassword ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            onIonInput={e => { vm.passwordRef.current = e.detail.value ?? ''; }}
            className="login-input"
            autocomplete="current-password"
          />
          <IonButton
            fill="clear"
            className="client-login-eye-btn"
            aria-label={vm.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => vm.setShowPassword(v => !v)}
          >
            <IonIcon slot="icon-only" icon={vm.showPassword ? eye : eyeOff} />
          </IonButton>
        </div>
      </div>

      {vm.biometricSupported && (
        <div className="login-biometric-toggle">
          <IonIcon icon={fingerPrintOutline} />
          <IonLabel>Usar bloqueo biométrico</IonLabel>
          <IonToggle checked={vm.biometricEnabled} onIonChange={e => vm.toggleBiometric(e.detail.checked)} />
        </div>
      )}

      <IonButton type="submit" expand="block" disabled={vm.loading} className="login-submit-btn">
        {vm.loading ? <IonSpinner name="dots" /> : (
          <>
            <IonIcon icon={logInOutline} slot="start" aria-hidden="true" />
            Iniciar sesión
          </>
        )}
      </IonButton>
    </form>
  </>
);

const LoginView: React.FC = () => {
  const vm = useLogin();
  const busy = vm.loading || vm.phone.loading;

  return (
    <IonPage>
      <IonContent className="ion-padding login-page-content login-app--smartloans">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeSm="8" sizeMd="6" sizeLg="4">
              <div className="login-brand">
                <div className="login-logo login-logo--mark">
                  <IonIcon src={SMARTLOANS_MARK_SRC} aria-hidden="true" />
                </div>
                <h1 className="login-title">GMO Prestamos</h1>
                <p className="login-subtitle">Préstamos entre personas</p>
              </div>

              <IonToast {...vm.toastProps} />

              <div className="login-card">
                {vm.mode === 'phone' ? <ClientPhoneLoginCard vm={vm.phone} /> : <PasswordForm vm={vm} />}

                <div className="login-links">
                  {vm.mode === 'phone' ? (
                    <IonButton fill="clear" size="small" disabled={busy} onClick={() => vm.setMode('password')}>
                      <IonIcon icon={personOutline} slot="start" aria-hidden="true" />
                      Usar usuario y contraseña
                    </IonButton>
                  ) : (
                    <IonButton fill="clear" size="small" disabled={busy} onClick={() => vm.setMode('phone')}>
                      <IonIcon icon={callOutline} slot="start" aria-hidden="true" />
                      Entrar con mi teléfono
                    </IonButton>
                  )}
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LoginView;
