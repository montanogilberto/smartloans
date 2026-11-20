import React from 'react';
import { IonBadge, IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/react';
import { documentTextOutline, openOutline } from 'ionicons/icons';
import { mxDate, fmtMXN } from '../../../../utils/format';
import { ProfileVM } from '../ProfileLogic';
import { useUser } from '../../../../contexts/UserContext';
import { actsAsLender } from '../../../../utils/productContext';

/**
 * Contratos — Pagaré + Contrato P2P (firmados una vez, en clientFaceRecognitions)
 * y el detalle por préstamo (digitalContracts, uno por cada préstamo fondeado).
 */
const ContractsCard: React.FC<{ vm: ProfileVM }> = ({ vm }) => {
  const { roleCode, activeProduct } = useUser();
  const nothingSigned = !vm.faceRecord?.pagareAccepted && !vm.faceRecord?.contractAccepted && vm.contracts.length === 0;
  // A lender signs no pagaré (only the contract with GMO Prestamos): don't list it as pending.
  const showPagare = !!vm.faceRecord?.pagareAccepted || !actsAsLender(roleCode, activeProduct);

  return (
    <IonCard className="profile-card">
      <IonCardContent>
        <div className="profile-section-header">
          <span className="profile-section-icon profile-icon-teal">
            <IonIcon icon={documentTextOutline} />
          </span>
          <div className="profile-section-heading">
            <h3>Contratos</h3>
            <p>Documentos legales firmados</p>
          </div>
        </div>

        {vm.loadingDocs ? (
          <div className="profile-loading-row"><IonSpinner name="crescent" /></div>
        ) : nothingSigned ? (
          <p className="profile-empty-text">Aún no tienes documentos firmados.</p>
        ) : (
          <>
            {showPagare && (
            <div className="profile-info-row">
              <span className="profile-row-icon profile-icon-teal-soft"><IonIcon icon={documentTextOutline} /></span>
              <div className="profile-row-text">
                <span>Pagaré</span>
                <strong>
                  {vm.faceRecord?.pagareAccepted
                    ? `Firmado el ${mxDate(vm.faceRecord.pagareAcceptedAt)}`
                    : 'Pendiente de firma'}
                </strong>
              </div>
              {vm.faceRecord?.pagarePdfBlobUrl && (
                <a href={vm.faceRecord.pagarePdfBlobUrl} target="_blank" rel="noreferrer" className="profile-pdf-link">
                  <IonIcon icon={openOutline} />
                </a>
              )}
            </div>
            )}

            <div className="profile-info-row">
              <span className="profile-row-icon profile-icon-teal-soft"><IonIcon icon={documentTextOutline} /></span>
              <div className="profile-row-text">
                <span>{showPagare ? 'Contrato de Crédito P2P' : 'Contrato de Crédito con GMO Prestamos'}</span>
                <strong>
                  {vm.faceRecord?.contractAccepted
                    ? `Firmado el ${mxDate(vm.faceRecord.contractAcceptedAt)}`
                    : 'Pendiente de firma'}
                </strong>
              </div>
              {vm.faceRecord?.contractPdfBlobUrl && (
                <a href={vm.faceRecord.contractPdfBlobUrl} target="_blank" rel="noreferrer" className="profile-pdf-link">
                  <IonIcon icon={openOutline} />
                </a>
              )}
            </div>

            {vm.faceRecord?.pagarePdfBlobUrl && (
              <div className="profile-info-row">
                <span className="profile-row-icon profile-icon-teal-soft"><IonIcon icon={documentTextOutline} /></span>
                <div className="profile-row-text">
                  <span>Pagaré</span>
                  <strong>{vm.faceRecord.contractAcceptedAt ? `Firmado el ${mxDate(vm.faceRecord.contractAcceptedAt)}` : 'Firmado'}</strong>
                </div>
                <a href={vm.faceRecord.pagarePdfBlobUrl} target="_blank" rel="noreferrer" className="profile-pdf-link" aria-label="Abrir Pagaré">
                  <IonIcon icon={openOutline} />
                </a>
              </div>
            )}

            {vm.faceRecord?.resguardoPdfBlobUrl && (
              <div className="profile-info-row">
                <span className="profile-row-icon profile-icon-teal-soft"><IonIcon icon={documentTextOutline} /></span>
                <div className="profile-row-text">
                  <span>Constancia de resguardo del pagaré</span>
                  <strong>{vm.faceRecord.contractAcceptedAt ? `Firmado el ${mxDate(vm.faceRecord.contractAcceptedAt)}` : 'Firmado'}</strong>
                </div>
                <a href={vm.faceRecord.resguardoPdfBlobUrl} target="_blank" rel="noreferrer" className="profile-pdf-link" aria-label="Abrir Constancia de resguardo del pagaré">
                  <IonIcon icon={openOutline} />
                </a>
              </div>
            )}

            {vm.contracts.length > 0 && (
              <div className="profile-loan-contracts">
                <p className="profile-loan-contracts-title">Contratos por préstamo</p>
                {vm.contracts.map(c => (
                  <div key={c.contractId} className="profile-info-row">
                    <span className="profile-row-icon profile-icon-teal-soft"><IonIcon icon={documentTextOutline} /></span>
                    <div className="profile-row-text">
                      <span>Préstamo #{c.loanId} · {mxDate(c.created_At)}</span>
                      <strong>{c.principalAmount ? fmtMXN(c.principalAmount) : '—'}</strong>
                    </div>
                    <IonBadge color={c.contractStatus === 'active' ? 'success' : 'medium'}>
                      {c.contractStatus}
                    </IonBadge>
                    {c.pdfBlobUrl && (
                      <a href={c.pdfBlobUrl} target="_blank" rel="noreferrer" className="profile-pdf-link">
                        <IonIcon icon={openOutline} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ContractsCard;
