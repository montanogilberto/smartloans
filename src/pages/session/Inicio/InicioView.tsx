import React from 'react';
import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useInicio } from './InicioLogic';

const InicioView: React.FC = () => {
  const vm = useInicio();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="session-center">
          {vm.state === 'loading' && (
            <>
              <IonSpinner name="crescent" />
              <p>Cargando tu cuenta…</p>
            </>
          )}
          {vm.state === 'load-failed' && (
            <>
              <h2>No pudimos cargar tu cuenta</h2>
              <p>Revisa tu conexión e inténtalo de nuevo.</p>
              <IonButton onClick={vm.retry} disabled={vm.retrying}>
                {vm.retrying ? <IonSpinner name="dots" /> : 'Reintentar'}
              </IonButton>
              <IonButton fill="clear" onClick={vm.signOut} disabled={vm.retrying}>Cerrar sesión</IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default InicioView;
