/**
 * Fills the blanks of the KYC documents with what is known when the person
 * signs: the date and their own name and address (from the reviewed INE data).
 *
 * Who signs what:
 *   - Prestamista ↔ GMO Prestamos: Contrato de Crédito (lenderContract.ts).
 *   - Profesional Jurídico ↔ GMO Prestamos: Contrato de Servicios (juridicalContract.ts).
 *   - Prestatario ↔ Prestamista: Contrato de Crédito (contract.ts), Pagaré and
 *     Constancia de Resguardo del pagaré.
 *
 * The other party, amount, rate and due date only exist once a loan is agreed,
 * so those blanks become a reference to the offer accepted in the platform —
 * the per-loan contract (loanContracts) carries the actual figures.
 *
 * Works by replacing the blank lines of the static texts, so the unfilled
 * templates (onboarding steps, juridical panel) are untouched.
 */
import { CONTRACT_TEXT } from './contract';
import { PAGARE_TEXT } from './pagare';
import { RESGUARDO_TEXT } from './resguardo';
import { LENDER_CONTRACT_TEXT } from './lenderContract';
import { JURIDICAL_CONTRACT_TEXT } from './juridicalContract';

export const PLATFORM_NAME = 'GMO Prestamos';

export interface DocumentFillData {
  /** Full name as reviewed on the Datos step. */
  nombre: string;
  /** Address as reviewed on the Datos step. */
  domicilio: string;
  /** Which side the signer is on ('juridical' = the Jurídico professional, not a loan party). */
  signerRole: 'lender' | 'borrower' | 'juridical';
  /** Signing date. */
  date: Date;
}

const LENDER_TBD = `el Prestamista cuya oferta sea aceptada en la plataforma ${PLATFORM_NAME}`;
const PER_OFFER = `conforme a la oferta aceptada en la plataforma ${PLATFORM_NAME}`;

/** "19 de noviembre de 2026". */
export const longDate = (d: Date): string =>
  d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

/** Replaces `blank` once; throws if the template changed, so a stale blank never ships unfilled. */
function fillOnce(text: string, blank: string, value: string): string {
  if (!text.includes(blank)) throw new Error(`Plantilla sin el espacio esperado: ${blank.slice(0, 40)}`);
  return text.replace(blank, value);
}

const nameOr = (name: string, fallback: string) => name.trim() || fallback;

/** The lender's contract with GMO Prestamos. */
export function fillLenderContract(data: DocumentFillData): string {
  let t = LENDER_CONTRACT_TEXT;
  t = fillOnce(t, 'a _______________', `a ${longDate(data.date)}`);
  t = fillOnce(t, '- PRESTAMISTA: _________________________________', `- PRESTAMISTA: ${nameOr(data.nombre, 'el Prestamista registrado en la Plataforma')}`);
  return t;
}

/** The Jurídico professional's services contract with GMO Prestamos. Role-independent. */
export function fillJuridicalContract(data: Pick<DocumentFillData, 'nombre' | 'date'>): string {
  let t = JURIDICAL_CONTRACT_TEXT;
  t = fillOnce(t, 'a _______________', `a ${longDate(data.date)}`);
  t = fillOnce(t, '- PROFESIONAL JURÍDICO: _________________________________', `- PROFESIONAL JURÍDICO: ${nameOr(data.nombre, 'el Profesional registrado en la Plataforma')}`);
  return t;
}

/** The borrower's credit contract with their lender (known once an offer is accepted). */
export function fillContract(data: DocumentFillData): string {
  if (data.signerRole === 'lender') return fillLenderContract(data);
  if (data.signerRole === 'juridical') return fillJuridicalContract(data);
  let t = CONTRACT_TEXT;
  t = fillOnce(t, 'a _______________', `a ${longDate(data.date)}`);
  t = fillOnce(t, '- ACREDITANTE: _________________________________ (Prestamista)', `- ACREDITANTE: ${LENDER_TBD} (Prestamista)`);
  t = fillOnce(t, '- ACREDITADO: _________________________________ (Prestatario)', `- ACREDITADO: ${nameOr(data.nombre, 'el Prestatario registrado en la plataforma')} (Prestatario)`);
  t = fillOnce(t, 'hasta $_________________ M.N.', `hasta el monto ${PER_OFFER}, en moneda nacional,`);
  return t;
}

/** Signed by the borrower, to the order of their lender. */
export function fillPagare(data: DocumentFillData): string {
  const subscriber = nameOr(data.nombre, 'el Acreditado');
  const address = data.domicilio.trim() || 'el registrado en su expediente';
  const beneficiary = LENDER_TBD;
  let t = PAGARE_TEXT;
  t = fillOnce(t, 'Lugar y Fecha: _______________', `Lugar y Fecha: ${longDate(data.date)}`);
  t = fillOnce(t, 'Yo, _________________________________', `Yo, ${subscriber}`);
  t = fillOnce(t, 'con domicilio en _________________________________', `con domicilio en ${address}`);
  t = fillOnce(t, 'a la orden de _________________________________', `a la orden de ${beneficiary}`);
  t = fillOnce(t, 'la cantidad de $_________________ (________________________ pesos 00/100 M.N.), en la fecha de vencimiento _____________,',
    `la cantidad, en moneda nacional, ${PER_OFFER}, en la fecha de vencimiento ahí pactada,`);
  t = fillOnce(t, 'un interés anual del ____% sobre saldos insolutos, pagadero de manera _____________.',
    `el interés anual sobre saldos insolutos y con la periodicidad pactados ${PER_OFFER}.`);
  t = fillOnce(t, 'será pagado en ___________________________.',
    `será pagado mediante transferencia SPEI directa a la cuenta CLABE que el Beneficiario tenga registrada en ${PLATFORM_NAME}.`);
  return t;
}

export function fillResguardo(data: DocumentFillData): string {
  return fillOnce(RESGUARDO_TEXT, 'Lugar y Fecha: _______________', `Lugar y Fecha: ${longDate(data.date)}`);
}
