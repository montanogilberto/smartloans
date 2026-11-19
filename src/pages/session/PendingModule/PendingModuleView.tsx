import React from 'react';
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { usePendingModule } from './PendingModuleLogic';

const PendingModuleView: React.FC<{ title: string }> = ({ title }) => {
  const vm = usePendingModule();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={vm.signOut}>Salir</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="session-center">
          <h2>Hola{vm.username ? `, ${vm.username}` : ''}</h2>
          <p>Este módulo se está migrando a la nueva app de SmartLoans.</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PendingModuleView;
