import React from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, documentTextOutline } from 'ionicons/icons';
import { TransferReadingResult } from '../../hooks/useTransferReading';
import { fmtMXN } from '../../utils/format';
import './TransferReadingNote.css';

/**
 * What the agent read from the attached receipt, shown under the photo of
 * both "Ya transferí" forms. Suggestions only — the person reviews the fields.
 */
const TransferReadingNote: React.FC<{
  busy: boolean;
  failed: boolean;
  result: TransferReadingResult | null;
  expectedAmountMXN?: number;
}> = ({ busy, failed, result, expectedAmountMXN }) => {
  if (busy) {
    return (
      <div className="trn trn--busy" role="status">
        <IonSpinner name="dots" />
        <span>Leyendo comprobante…</span>
      </div>
    );
  }
  if (failed) {
    return (
      <div className="trn trn--warn" role="status">
        <IonIcon icon={alertCircleOutline} aria-hidden="true" />
        <span>No pudimos leer el comprobante. Llena los datos a mano.</span>
      </div>
    );
  }
  if (!result) return null;
  const { reading, amountMismatch } = result;

  if (!reading.isTransferReceipt) {
    return (
      <div className="trn trn--warn" role="status">
        <IonIcon icon={alertCircleOutline} aria-hidden="true" />
        <span>La foto no parece un comprobante de transferencia SPEI. Revisa que sea el correcto.</span>
      </div>
    );
  }

  return (
    <div className={`trn ${amountMismatch || reading.needsReview ? 'trn--warn' : 'trn--ok'}`} role="status">
      <IonIcon icon={amountMismatch || reading.needsReview ? alertCircleOutline : checkmarkCircleOutline} aria-hidden="true" />
      <div className="trn-body">
        <strong><IonIcon icon={documentTextOutline} aria-hidden="true" /> Leímos tu comprobante</strong>
        <dl>
          {reading.amountMXN > 0 && <><dt>Monto</dt><dd>{fmtMXN(reading.amountMXN)}</dd></>}
          {reading.transferDate && <><dt>Fecha</dt><dd>{reading.transferDate}</dd></>}
          {reading.bankFrom && <><dt>Banco</dt><dd>{reading.bankFrom}</dd></>}
          {reading.claveRastreo && <><dt>Clave de rastreo</dt><dd>{reading.claveRastreo}</dd></>}
        </dl>
        {amountMismatch && expectedAmountMXN != null && (
          <p className="trn-alert">
            El monto no coincide con el préstamo ({fmtMXN(expectedAmountMXN)}). Verifica tu transferencia antes de declararla.
          </p>
        )}
        {reading.issues.length > 0 && <p className="trn-alert">{reading.issues.join(' · ')}</p>}
        <p className="trn-hint">Revisa los datos antes de confirmar.</p>
      </div>
    </div>
  );
};

export default TransferReadingNote;
