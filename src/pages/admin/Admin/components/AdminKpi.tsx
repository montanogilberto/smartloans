import React from 'react';
import { statsChartOutline } from 'ionicons/icons';
import EmptyState from '../../../../components/ui/EmptyState';
import { fmtInt, fmtMXN } from '../../../../utils/format';
import { monthLabel } from '../adminMetrics';
import type { AdminVM } from '../AdminLogic';
import KpiTile from './KpiTile';

/** /admin/kpi — the full KPI set plus the GMO Prestamos percentage tracked by month and by lender. */
const AdminKpi: React.FC<{ vm: AdminVM }> = ({ vm }) => {
  const k = vm.kpis;
  const maxMonth = Math.max(1, ...vm.months.map(m => m.fundedAmount));

  return (
    <>
      <section className="adm-hero">
        <p className="adm-hero-label">Comisión GMO Prestamos ({k.feePct}%)</p>
        <p className="adm-hero-value">{fmtMXN(k.feeAmount)}</p>
        <p className="adm-hero-sub">
          {k.feePct}% sobre {fmtMXN(k.fundedAmount)} colocados. Indicador de seguimiento: la app no cobra ni mueve este dinero.
        </p>
      </section>

      <h3 className="adm-section-title">Cartera</h3>
      <div className="adm-grid">
        <KpiTile label="Monto colocado" value={fmtMXN(k.fundedAmount)} hint={`${fmtInt(k.fundedCount)} préstamos`} />
        <KpiTile label="Cartera vigente" value={fmtMXN(k.openAmount)} hint={`${fmtInt(k.openCount)} préstamos`} />
        <KpiTile label="Índice de mora" value={`${k.latePct}%`} hint={`${fmtMXN(k.lateAmount)} · ${fmtInt(k.lateCount)} préstamos`} tone={k.latePct > 10 ? 'danger' : k.latePct > 0 ? 'warning' : 'success'} />
        <KpiTile label="Liquidados" value={`${k.settledPct}%`} hint={`${fmtInt(k.settledCount)} préstamos`} tone="success" />
        <KpiTile label="Ticket promedio" value={fmtMXN(k.avgTicket)} />
        <KpiTile label="Intereses pactados" value={fmtMXN(k.expectedInterest)} hint="para los prestamistas" />
        <KpiTile label="Tasa promedio" value={`${k.avgRate}%`} hint="ponderada por monto" />
        <KpiTile label="Plazo promedio" value={`${k.avgTermMonths} m`} />
      </div>

      <h3 className="adm-section-title">Marketplace y usuarios</h3>
      <div className="adm-grid">
        <KpiTile label="Solicitudes pendientes" value={fmtInt(k.proposalsPending)} hint={`de ${fmtInt(k.proposalsTotal)}`} tone={k.proposalsPending ? 'warning' : 'default'} />
        <KpiTile label="Tasa de aceptación" value={`${k.acceptancePct}%`} />
        <KpiTile label="Capital publicado" value={fmtMXN(k.publishedCapital)} hint={`${fmtInt(k.offersActive)} ofertas activas`} />
        <KpiTile label="Por fondear" value={fmtMXN(k.pipelineAmount)} hint={`${fmtInt(k.pipelineCount)} préstamos`} />
        <KpiTile label="Acreditados" value={fmtInt(k.borrowers)} />
        <KpiTile label="Prestamistas" value={fmtInt(k.lenders)} />
        <KpiTile label="Jurídico" value={fmtInt(k.juridical)} />
        <KpiTile label="Cuentas inactivas" value={fmtInt(k.inactiveClients)} />
      </div>

      <h3 className="adm-section-title">Seguimiento mensual</h3>
      {vm.months.length === 0 ? (
        <EmptyState icon={statsChartOutline} text="Todavía no hay préstamos con fecha." />
      ) : (
        <div className="adm-card">
          {vm.months.map(m => (
            <div key={m.month} className="adm-month">
              <div className="adm-month-head">
                <span className="adm-month-label">{monthLabel(m.month)}</span>
                <span className="adm-month-fee">{k.feePct}% = {fmtMXN(m.feeAmount)}</span>
              </div>
              <span className="adm-bar-track">
                <span className="adm-bar-fill adm-bar-fill--primary" style={{ width: `${(m.fundedAmount / maxMonth) * 100}%` }} />
              </span>
              <span className="adm-muted">
                {fmtMXN(m.fundedAmount)} colocados · {fmtInt(m.loans)} préstamos{m.lateCount ? ` · ${m.lateCount} en mora` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <h3 className="adm-section-title">Por prestamista</h3>
      {vm.lenderRows.length === 0 ? (
        <EmptyState icon={statsChartOutline} text="Aún no hay préstamos fondeados con prestamista identificado." />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Prestamista</th><th>Préstamos</th><th>Colocado</th><th>En mora</th><th>{k.feePct}%</th></tr>
            </thead>
            <tbody>
              {vm.lenderRows.map(r => (
                <tr key={r.lenderId} onClick={() => vm.openClient(r.lenderId)}>
                  <td>{vm.clientName(r.lenderId)}</td>
                  <td>{fmtInt(r.loans)}</td>
                  <td>{fmtMXN(r.fundedAmount)}</td>
                  <td className={r.lateAmount ? 'adm-danger' : undefined}>{fmtMXN(r.lateAmount)}</td>
                  <td>{fmtMXN(r.feeAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AdminKpi;
