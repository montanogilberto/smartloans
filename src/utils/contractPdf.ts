import { jsPDF } from 'jspdf';
import { CONTRACT_TEXT } from '../pages/loans/BorrowerOnboarding/documents/contract';
import { PAGARE_TEXT } from '../pages/loans/BorrowerOnboarding/documents/pagare';
import { RESGUARDO_TEXT } from '../pages/loans/BorrowerOnboarding/documents/resguardo';
import {
  DocumentFillData, fillContract, fillPagare, fillResguardo,
} from '../pages/loans/BorrowerOnboarding/documents/fill';

export interface ContractPdfParams {
  clientId: number;
  nombre: string;
  domicilio: string;
  curp: string;
  claveElector: string;
  fechaNacimiento: string;
  documentType: string;
  isVerified: boolean;
  confidenceScore: number;
  acceptedAtISO: string;
  signatureDataUrl: string;
  /** Which side the signer is on — decides the documents and where their name goes. */
  signerRole: KycSignerRole;
}

/** The documents signed at the KYC Contrato step, in signing order. */
export type KycDocumentId = 'contrato' | 'pagare' | 'resguardo';
export type KycSignerRole = 'lender' | 'borrower' | 'juridical';

export const KYC_DOCUMENTS: ReadonlyArray<{ id: KycDocumentId; title: string; text: string }> = [
  { id: 'contrato', title: 'Contrato de Crédito', text: CONTRACT_TEXT },
  { id: 'pagare', title: 'Pagaré', text: PAGARE_TEXT },
  { id: 'resguardo', title: 'Constancia de Resguardo del Pagaré Físico', text: RESGUARDO_TEXT },
];

/**
 * Who signs what:
 *   - Prestamista: one Contrato de Crédito, with GMO Prestamos.
 *   - Prestatario: Contrato de Crédito, Pagaré and Constancia de Resguardo, with the Prestamista.
 *   - Jurídico: one Contrato de Prestación de Servicios, with GMO Prestamos.
 */
export const kycDocumentsFor = (role: KycSignerRole) => (role === 'lender'
  ? [{ id: 'contrato' as const, title: 'Contrato de Crédito con GMO Prestamos' }]
  : role === 'juridical'
    ? [{ id: 'contrato' as const, title: 'Contrato de Servicios con GMO Prestamos' }]
    : KYC_DOCUMENTS.map(({ id, title }) => ({ id, title })));

/** The document's text with its blanks filled for this signer (see documents/fill.ts). */
export function kycDocumentText(id: KycDocumentId, data: DocumentFillData): string {
  if (id === 'contrato') return fillContract(data);
  if (id === 'pagare') return fillPagare(data);
  return fillResguardo(data);
}

const FIELD_ROWS: Array<{ label: string; key: keyof ContractPdfParams }> = [
  { label: 'Nombre completo', key: 'nombre' },
  { label: 'Domicilio', key: 'domicilio' },
  { label: 'CURP', key: 'curp' },
  { label: 'Clave de elector', key: 'claveElector' },
  { label: 'Fecha de nacimiento', key: 'fechaNacimiento' },
  { label: 'Documento de identidad', key: 'documentType' },
];

const MARGIN_X = 20;
const MARGIN_BOTTOM = 20;
const PAGE_TOP = 20;

/** Moves to a new page when `needed` mm don't fit below y; returns the y to write at. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - MARGIN_BOTTOM) return y;
  doc.addPage();
  return PAGE_TOP;
}

// Shared header: title + a client-data table. Every extracted-ID field this
// document carries came from a human-reviewed, editable form (see
// IdExtractedFieldsSummary.tsx) — never inserted un-reviewed — so a blank
// field here means the client's own review left it blank, not a bug.
function renderHeader(doc: jsPDF, title: string, params: ContractPdfParams): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`GMO Prestamos · Cliente ID: ${params.clientId}`, pageWidth / 2, 27, { align: 'center' });

  let y = 40;
  doc.setFontSize(11);
  for (const { label, key } of FIELD_ROWS) {
    const value = String(params[key] ?? '').trim() || '—';
    const lines = doc.splitTextToSize(value, pageWidth - 95);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(`${label}:`, MARGIN_X, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(lines, 75, y);
    y += Math.max(1, lines.length) * 6 + 2;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Verificación biométrica: ${params.isVerified ? 'verificada' : 'no verificada'}` +
      (params.confidenceScore ? ` (${(params.confidenceScore * 100).toFixed(1)}%)` : ''),
    MARGIN_X,
    y + 4
  );

  return y + 14;
}

/** The document's full legal text, wrapped and paginated. */
function renderBody(doc: jsPDF, startY: number, text: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineHeight = 4.6;
  let y = startY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { y += lineHeight / 2; continue; }
    const lines: string[] = doc.splitTextToSize(paragraph, pageWidth - MARGIN_X * 2);
    for (const line of lines) {
      y = ensureSpace(doc, y, lineHeight);
      doc.text(line, MARGIN_X, y);
      y += lineHeight;
    }
  }
  return y + 6;
}

function renderSignatureAndFooter(doc: jsPDF, startY: number, params: ContractPdfParams, acceptanceLine: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  const lines = doc.splitTextToSize(acceptanceLine, pageWidth - MARGIN_X * 2);
  // Acceptance line + signature + caption stay together on one page.
  let y = ensureSpace(doc, startY, lines.length * 6 + 10 + (params.signatureDataUrl ? 32 : 0) + 10);
  doc.text(lines, MARGIN_X, y);
  y += lines.length * 6 + 10;

  if (params.signatureDataUrl) {
    doc.addImage(params.signatureDataUrl, 'PNG', MARGIN_X, y, 70, 28);
    y += 32;
  }
  doc.setDrawColor(209, 213, 219);
  doc.line(MARGIN_X, y, 90, y);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Firma electrónica', MARGIN_X, y + 5);

  const acceptedDate = params.acceptedAtISO ? new Date(params.acceptedAtISO) : new Date();
  doc.text(`Aceptado el ${acceptedDate.toLocaleString('es-MX')}`, pageWidth - MARGIN_X, y + 5, { align: 'right' });
}

// Returns base64 WITHOUT the "data:application/pdf;base64," prefix — matches
// how every other base64 payload field in this flow (contractSignatureBase64,
// idSignatureCropBase64) is already sent to the backend.
function toBase64(doc: jsPDF): string {
  return doc.output('datauristring').split(',')[1];
}

function buildPdf(id: KycDocumentId, params: ContractPdfParams, acceptanceLine: string): string {
  const { title } = kycDocumentsFor(params.signerRole).find(d => d.id === id) ?? KYC_DOCUMENTS.find(d => d.id === id)!;
  const text = kycDocumentText(id, {
    nombre: params.nombre,
    domicilio: params.domicilio,
    signerRole: params.signerRole,
    date: params.acceptedAtISO ? new Date(params.acceptedAtISO) : new Date(),
  });
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const y = renderBody(doc, renderHeader(doc, title, params), text);
  renderSignatureAndFooter(doc, y, params, acceptanceLine);
  return toBase64(doc);
}

/**
 * Unsigned copy of a KYC document for the signer to keep and read before
 * accepting: the same filled-in text the "Leer" modal shows, no signature.
 */
export function buildKycDocumentPreviewPdf(id: KycDocumentId, title: string, data: DocumentFillData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(doc.splitTextToSize(title, pageWidth - MARGIN_X * 2), pageWidth / 2, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('GMO Prestamos · Copia para lectura, sin firma', pageWidth / 2, 34, { align: 'center' });
  renderBody(doc, 44, kycDocumentText(id, data));
  return doc;
}

export function generateContractPdfBase64(params: ContractPdfParams): string {
  return buildPdf('contrato', params,
    'El cliente declara haber leído, entendido y aceptado los términos y condiciones de este contrato de crédito, ' +
      'incluyendo el monto, tasa y plazo acordados en la solicitud de préstamo correspondiente.');
}

export function generatePagarePdfBase64(params: ContractPdfParams & { hasPhysicalPagare: boolean }): string {
  return buildPdf('pagare', params,
    'El cliente reconoce deber y se compromete a pagar la cantidad acordada en los términos establecidos en el contrato de crédito. ' +
      `Pagaré físico en resguardo: ${params.hasPhysicalPagare ? 'sí' : 'no'}.`);
}

export function generateResguardoPdfBase64(params: ContractPdfParams & { hasPhysicalPagare: boolean }): string {
  return buildPdf('resguardo', params,
    params.hasPhysicalPagare
      ? 'El cliente confirma que el ejemplar físico del Pagaré está en resguardo en los términos de esta constancia.'
      : 'El cliente indicó que, a la fecha de firma, el ejemplar físico del Pagaré aún no está en resguardo.');
}
