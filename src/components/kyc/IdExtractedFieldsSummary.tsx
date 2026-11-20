import React, { useState } from 'react';
import { IonInput, IonSpinner, IonIcon, IonProgressBar } from '@ionic/react';
import {
  alertCircleOutline,
  checkmarkCircle,
  chevronDownOutline,
  chevronUpOutline,
  ellipseOutline,
  idCardOutline,
  locationOutline,
  warningOutline,
} from 'ionicons/icons';
import { ExtractedIdFields } from '../../utils/idOcr';
import ZoomableImage from '../ui/ZoomableImage';
import './IdExtractedFieldsSummary.css';

interface IdExtractedFieldsSummaryProps {
  fields: ExtractedIdFields;
  onFieldsChange: (fields: ExtractedIdFields) => void;
  ocrLoading: boolean;
  ocrError: string;
  /** Fields the agent read but is not sure about — shown with "Revisa este dato". */
  lowConfidence?: (keyof ExtractedIdFields)[];
  /** Captured INE photos (base64 or blob URL), shown in the "Ver credencial" panel. */
  frontImage?: string;
  backImage?: string;
  /**
   * Address reverse-geocoded from the presence capture, shown read-only under
   * Domicilio (INE). undefined = no presence capture yet (row hidden); '' = the
   * lookup gave nothing ("No disponible").
   */
  gpsAddress?: string;
}

type FieldStatus = 'read' | 'check' | 'missing';

/** read = has a value; check = has a value the agent wasn't sure about; missing = empty. */
export function fieldStatus(
  fields: ExtractedIdFields,
  key: keyof ExtractedIdFields,
  lowConfidence: (keyof ExtractedIdFields)[],
): FieldStatus {
  if (!String(fields[key] ?? '').trim()) return 'missing';
  return lowConfidence.includes(key) ? 'check' : 'read';
}

const STATUS_ICON: Record<FieldStatus, string> = {
  read: checkmarkCircle,
  check: warningOutline,
  missing: ellipseOutline,
};

// Domicilio and Clave de Elector are required on the contract (see
// contractPdf.ts) despite neither being reliably auto-extractable (confirmed
// via extensive on-device testing: the INE's anti-copy watermark defeats
// OCR, and a Gemini-vision alternative fabricated a different address/clave
// on nearly every call against the same photo) — kept here as manual-entry
// fields the client fills in by hand.
/** Digit-only fields and their exact length (RFC-015). */
const DIGIT_FIELDS: Partial<Record<keyof ExtractedIdFields, number>> = { cic: 9, ocr: 13, vigencia: 4 };

const FIELD_LABELS: Array<{ key: keyof ExtractedIdFields; label: string }> = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'domicilio', label: 'Domicilio (INE)' },
  { key: 'curp', label: 'CURP' },
  { key: 'claveElector', label: 'Clave de elector' },
  { key: 'fechaNacimiento', label: 'Fecha de nacimiento' },
  // RFC-015: back of the INE (machine-readable zone). Used to verify the credential with the INE.
  { key: 'cic', label: 'CIC (reverso, 9 dígitos)' },
  { key: 'ocr', label: 'OCR (reverso, 13 dígitos)' },
  { key: 'vigencia', label: 'Vigencia (último año)' },
];

// Pure display/edit component — the OCR fetch itself runs in the parent
// (ClientFaceRecognitionPage) as soon as front+back captures are ready, so
// it has time to finish in the background before this is ever shown (see
// that component's OCR effect for why).
const IdExtractedFieldsSummary: React.FC<IdExtractedFieldsSummaryProps> = ({
  fields,
  onFieldsChange,
  ocrLoading,
  ocrError,
  lowConfidence = [],
  frontImage,
  backImage,
  gpsAddress,
}) => {
  const [showCredential, setShowCredential] = useState(false);
  const statuses = FIELD_LABELS.map(({ key }) => fieldStatus(fields, key, lowConfidence));
  const readCount = statuses.filter((st) => st !== 'missing').length;
  const checkCount = statuses.filter((st) => st === 'check').length;
  const total = FIELD_LABELS.length;
  const progressColor = readCount === total ? (checkCount ? 'warning' : 'success') : 'primary';

  return (
    <div className="id-extracted-fields ion-margin-top">
      {(frontImage || backImage) && (
        <div className="id-credential-panel">
          <button
            type="button"
            className="id-credential-toggle"
            aria-expanded={showCredential}
            onClick={() => setShowCredential((v) => !v)}
          >
            <IonIcon icon={idCardOutline} />
            <span>{showCredential ? 'Ocultar credencial' : 'Ver credencial'}</span>
            <IonIcon icon={showCredential ? chevronUpOutline : chevronDownOutline} className="id-credential-chevron" />
          </button>
          {showCredential && (
            <div className="id-credential-images">
              <div className="id-credential-side">
                <span className="id-credential-side-title">Frente</span>
                {frontImage
                  ? <ZoomableImage src={frontImage} alt="Frente de la credencial" className="id-credential-image" />
                  : <div className="id-credential-placeholder">Sin captura</div>}
              </div>
              <div className="id-credential-side">
                <span className="id-credential-side-title">Reverso</span>
                {backImage
                  ? <ZoomableImage src={backImage} alt="Reverso de la credencial" className="id-credential-image" />
                  : <div className="id-credential-placeholder">Sin captura</div>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="id-extracted-fields-header">
        <span>Datos extraídos de la identificación</span>
        {ocrLoading && <IonSpinner name="crescent" />}
      </div>

      <div className="id-read-progress" aria-live="polite">
        <div className="id-read-progress-label">
          <span>{ocrLoading ? 'Leyendo tu credencial…' : `${readCount} de ${total} datos leídos`}</span>
          {!ocrLoading && checkCount > 0 && <span className="id-read-progress-check">{checkCount} por revisar</span>}
        </div>
        {ocrLoading
          ? <IonProgressBar type="indeterminate" />
          : <IonProgressBar value={readCount / total} color={progressColor} />}
      </div>

      {ocrError && (
        <p className="id-extracted-fields-error">
          <IonIcon icon={alertCircleOutline} /> {ocrError}
        </p>
      )}

      {FIELD_LABELS.map(({ key, label }, i) => (
        <div className="id-extracted-field" key={key}>
          <label className="id-extracted-field-label">
            {!ocrLoading && (
              <IonIcon
                icon={STATUS_ICON[statuses[i]]}
                className={`id-field-status id-field-status--${statuses[i]}`}
                aria-label={statuses[i] === 'read' ? 'Leído' : statuses[i] === 'check' ? 'Por revisar' : 'No detectado'}
              />
            )}
            {label}
          </label>
          <IonInput
            className="id-extracted-field-input"
            fill="outline"
            value={fields[key]}
            placeholder={ocrLoading ? 'Leyendo...' : 'No detectado'}
            inputmode={DIGIT_FIELDS[key] ? 'numeric' : undefined}
            maxlength={DIGIT_FIELDS[key]}
            onIonInput={(e) => {
              const raw = e.detail.value ?? '';
              onFieldsChange({ ...fields, [key]: DIGIT_FIELDS[key] ? raw.replace(/\D/g, '') : raw });
            }}
          />
          {!!fields[key] && lowConfidence.includes(key) && (
            <span className="id-extracted-field-check">Revisa este dato: no se leyó con claridad.</span>
          )}
          {key === 'domicilio' && gpsAddress !== undefined && (
            <div className="id-extracted-field id-gps-address">
              <label className="id-extracted-field-label">
                <IonIcon icon={locationOutline} className="id-field-status" aria-hidden="true" />
                Ubicación actual (GPS)
              </label>
              <IonInput
                className="id-extracted-field-input"
                fill="outline"
                value={gpsAddress || 'No disponible'}
                readonly
              />
              <span className="id-gps-address-hint">
                Dónde estabas al grabar tu video. Se guarda aparte; no cambia tu domicilio de la INE.
              </span>
            </div>
          )}
        </div>
      ))}

      <p className="id-extracted-fields-hint">
        Verifica y corrige estos datos si es necesario — se detectan automáticamente y pueden contener errores.
      </p>
    </div>
  );
};

export default IdExtractedFieldsSummary;
