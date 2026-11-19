import React from 'react';
import {
  IonPopover,
  IonList,
  IonItemDivider,
  IonButton,
  IonItem,
  IonLabel,
  IonIcon,
} from '@ionic/react';
import { alertCircleOutline, closeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import './AlertPopover.css';

/** One pending thing the user should act on (e.g. a setup step). */
export interface PopoverAlert {
  id: string;
  title: string;
  detail?: string;
  /** Tapping the alert closes the popover and runs this. */
  onSelect?: () => void;
}

interface AlertPopoverProps {
  isOpen: boolean;
  event: Event | undefined;
  onDidDismiss: () => void;
  /** Pages with something pending pass it here; none → "Sin alertas pendientes". */
  alerts?: PopoverAlert[];
}

/**
 * Header "Alertas" popover. Was a POS stub that only printed the username;
 * now lists the alerts the page passes (the lender dashboard sends its
 * unfinished "Primeros pasos").
 */
const AlertPopover: React.FC<AlertPopoverProps> = ({ isOpen, event, onDidDismiss, alerts = [] }) => (
  <IonPopover isOpen={isOpen} event={event} onDidDismiss={onDidDismiss} className="alert-popover">
    <IonList>
      <IonItemDivider>
        Alertas
        <IonButton fill="clear" slot="end" onClick={onDidDismiss} aria-label="Cerrar">
          <IonIcon icon={closeOutline} />
        </IonButton>
      </IonItemDivider>
      {alerts.length === 0 ? (
        <IonItem lines="none">
          <IonIcon icon={checkmarkCircleOutline} slot="start" color="success" />
          <IonLabel>Sin alertas pendientes</IonLabel>
        </IonItem>
      ) : alerts.map(a => (
        <IonItem
          key={a.id}
          button={!!a.onSelect}
          detail={!!a.onSelect}
          onClick={a.onSelect ? () => { onDidDismiss(); a.onSelect!(); } : undefined}
        >
          <IonIcon icon={alertCircleOutline} slot="start" color="warning" />
          <IonLabel className="ion-text-wrap">
            <h3>{a.title}</h3>
            {a.detail && <p>{a.detail}</p>}
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  </IonPopover>
);

export default AlertPopover;
