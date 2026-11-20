import React from 'react';

interface KpiTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

/** One KPI: small label, big number, optional context line. */
const KpiTile: React.FC<KpiTileProps> = ({ label, value, hint, tone = 'default' }) => (
  <div className={`adm-tile adm-tile--${tone}`}>
    <span className="adm-tile-label">{label}</span>
    <span className="adm-tile-value">{value}</span>
    {hint && <span className="adm-tile-hint">{hint}</span>}
  </div>
);

export default KpiTile;
