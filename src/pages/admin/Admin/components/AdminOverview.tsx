import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  briefcaseOutline, cashOutline, chevronForward, documentTextOutline, mailOpenOutline, statsChartOutline, walletOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { fmtInt, fmtMXN } from '../../../../utils/format';
import { LOAN_STATUS } from '../../../../components/ui/statusMaps';
import type { AdminVM } from '../AdminLogic';
import KpiTile from './KpiTile';

/** /admin — the headline numbers and a door to every section. */
const AdminOverview: React.FC<{ vm: AdminVM }> = ({ vm }) => {
  const history = useHistory();
  const k = vm.kpis;

  const sections = [
    { to: '/admin/loans', icon: documentTextOutline, label: 'Préstamos', detail: `${fmtInt(k.loansTotal)} en total · ${fmtInt(k.lateCount)} en mora` },
    { to: '/admin/proposals', icon: mailOpenOutline, label: 'Solicitudes', detail: `${fmtInt(k.proposalsPending)} pendientes de ${fmtInt(k.proposalsTotal)}` },
    { to: '/admin/borrowers', icon: walletOutline, label: 'Acreditados', detail: `${fmtInt(k.borrowers)} registrados` },
    { to: '/admin/lenders', icon: cashOutline, label: 'Prestamistas', detail: `${fmtInt(k.lenders)} registrados · ${fmtMXN(k.publishedCapital)} publicados` },
    { to: '/admin/juridical', icon: briefcaseOutline, label: 'Jurídico', detail: `${fmtInt(k.juridical)} asesores` },
    { to: '/admin/kpi', icon: statsChartOutline, label: 'KPI y comisión', detail: `${k.feePct}% GMO Prestamos · ${fmtMXN(k.feeAmount)}` },
  ];

  const statuses = Object.entries(k.byStatus).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <section className="adm-hero">
        <p className="adm-hero-label">Monto colocado</p>
        <p className="adm-hero-value">{fmtMXN(k.fundedAmount)}</p>
        <p className="adm-hero-sub">
          {fmtInt(k.fundedCount)} préstamos fondeados · {k.feePct}% GMO Prestamos = <strong>{fmtMXN(k.feeAmount)}</strong>
        </p>
      </section>

      <div className="adm-grid">
        <KpiTile label="Cartera vigente" value={fmtMXN(k.openAmount)} hint={`${fmtInt(k.openCount)} préstamos`} />
        <KpiTile label="Cartera en mora" value={`${k.latePct}%`} hint={fmtMXN(k.lateAmount)} tone={k.latePct > 10 ? 'danger' : k.latePct > 0 ? 'warning' : 'success'} />
        <KpiTile label="Liquidados" value={`${k.settledPct}%`} hint={`${fmtInt(k.settledCount)} de ${fmtInt(k.fundedCount)}`} tone="success" />
        <KpiTile label="Por fondear" value={fmtMXN(k.pipelineAmount)} hint={`${fmtInt(k.pipelineCount)} en proceso`} tone="warning" />
        <KpiTile label="Tasa promedio" value={`${k.avgRate}%`} hint={`Plazo ${k.avgTermMonths} meses`} />
        <KpiTile label="Aceptación" value={`${k.acceptancePct}%`} hint="de solicitudes resueltas" />
      </div>

      <h3 className="adm-section-title">Administrar</h3>
      <div className="adm-nav">
        {sections.map(s => (
          <button key={s.to} type="button" className="adm-nav-item" onClick={() => history.push(s.to)}>
            <IonIcon icon={s.icon} className="adm-nav-icon" aria-hidden="true" />
            <span className="adm-nav-text">
              <span className="adm-nav-label">{s.label}</span>
              <span className="adm-nav-detail">{s.detail}</span>
            </span>
            <IonIcon icon={chevronForward} className="adm-nav-chevron" aria-hidden="true" />
          </button>
        ))}
      </div>

      {statuses.length > 0 && (
        <>
          <h3 className="adm-section-title">Préstamos por estado</h3>
          <div className="adm-card">
            {statuses.map(([status, count]) => (
              <div key={status} className="adm-bar-row">
                <span className="adm-bar-label">{LOAN_STATUS[status]?.label ?? status}</span>
                <span className="adm-bar-track">
                  <span
                    className={`adm-bar-fill adm-bar-fill--${LOAN_STATUS[status]?.color ?? 'medium'}`}
                    style={{ width: `${(count / k.loansTotal) * 100}%` }}
                  />
                </span>
                <span className="adm-bar-value">{fmtInt(count)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default AdminOverview;
