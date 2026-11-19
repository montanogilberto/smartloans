import React from 'react';
import { IonButton, IonCard, IonCardContent, IonContent, IonIcon, IonPage, IonSpinner, IonToast } from '@ionic/react';
import { copyOutline, peopleOutline, shareSocialOutline } from 'ionicons/icons';
import Header from '../../../components/layout/Header';
import AlertPopover from '../../../components/popovers/AlertPopover';
import MailPopover from '../../../components/popovers/MailPopover';
import { usePopovers } from '../../../hooks/usePopovers';
import { useInvite } from './InviteLogic';

const InviteView: React.FC = () => {
  const vm = useInvite();
  const pops = usePopovers();

  return (
    <IonPage>
      <Header {...pops.headerProps} screenTitle="Invitar" />
      <AlertPopover {...pops.alertPopoverProps} />
      <MailPopover {...pops.mailPopoverProps} />
      <IonContent className="ion-padding invite-content">
        <IonToast {...vm.toastProps} />

        <div className="invite-hero">
          <span className="invite-hero-icon"><IonIcon icon={peopleOutline} aria-hidden="true" /></span>
          <h1>Invita a tus conocidos</h1>
          <p>Comparte GMO Prestamos con quien quiera prestar o pedir un préstamo entre personas.</p>
        </div>

        <IonCard className="invite-card">
          <IonCardContent>
            <p className="invite-preview-label">Tu invitación</p>
            <p className="invite-preview">{vm.message}</p>
          </IonCardContent>
        </IonCard>

        <IonButton expand="block" className="invite-share-btn" disabled={vm.sharing} onClick={vm.share}>
          {vm.sharing ? <IonSpinner name="dots" /> : (
            <>
              <IonIcon icon={shareSocialOutline} slot="start" aria-hidden="true" />
              Compartir invitación
            </>
          )}
        </IonButton>
        <IonButton expand="block" fill="outline" className="invite-copy-btn" onClick={vm.copy}>
          <IonIcon icon={copyOutline} slot="start" aria-hidden="true" />
          Copiar invitación
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default InviteView;
