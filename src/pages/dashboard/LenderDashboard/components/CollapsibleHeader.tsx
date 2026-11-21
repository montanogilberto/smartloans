import React, { useEffect, useState } from 'react';
import { IonCardHeader, IonCardTitle, IonIcon, IonProgressBar } from '@ionic/react';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

/**
 * Plegar/desplegar una tarjeta del dashboard. Una tarjeta completa
 * (`defaultCollapsed`) queda SIEMPRE plegada al entrar; una pendiente, abierta.
 * Sigue el estado en vivo: los datos llegan después del primer render, así que
 * se decide cuando cambia `defaultCollapsed`, no sólo al montar. Abrir o cerrar
 * a mano vale mientras dure la visita — no se guarda en el dispositivo (antes
 * se guardaba y una tarjeta completa abierta una vez quedaba abierta para siempre).
 */
export function useCollapsed(key: string, defaultCollapsed: boolean): [boolean, () => void] {
  const [override, setOverride] = useState<boolean | null>(null);
  // Completar (o dejar de estar completa) vuelve al comportamiento por defecto.
  useEffect(() => { setOverride(null); }, [defaultCollapsed]);
  useEffect(() => {
    // Limpia la preferencia que guardaba la versión anterior.
    try { localStorage.removeItem(`ld.collapsed.${key}`); } catch { /* sin storage */ }
  }, [key]);
  const collapsed = override ?? defaultCollapsed;
  const toggle = () => setOverride(!collapsed);
  return [collapsed, toggle];
}

const CollapsibleHeader: React.FC<{
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  /** Resumen de una línea visible sólo con la tarjeta plegada. */
  summary?: React.ReactNode;
  /** Acciones a la derecha (p. ej. refrescar); no pliegan la tarjeta. */
  actions?: React.ReactNode;
  /** Avance 0–1; se dibuja como barra con la tarjeta plegada. */
  progress?: number;
}> = ({ title, collapsed, onToggle, summary, actions, progress }) => (
  <IonCardHeader>
    <div className="ldx-collapse-row">
      <button type="button" className="ldx-collapse-toggle" aria-expanded={!collapsed} onClick={onToggle}>
        <span className="ldx-collapse-text">
          <IonCardTitle>{title}</IonCardTitle>
          {collapsed && summary && <span className="ldx-collapse-summary">{summary}</span>}
          {collapsed && progress != null && (
            <IonProgressBar value={Math.min(Math.max(progress, 0), 1)}
              color={progress >= 1 ? 'success' : 'primary'} className="ldx-collapse-progress" />
          )}
        </span>
        <IonIcon icon={collapsed ? chevronDownOutline : chevronUpOutline} className="ldx-collapse-chevron" />
      </button>
      {actions}
    </div>
  </IonCardHeader>
);

export default CollapsibleHeader;
