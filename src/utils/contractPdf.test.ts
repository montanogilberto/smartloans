import { describe, it, expect } from 'vitest';
import { generateContractPdfBase64, generatePagarePdfBase64, generateResguardoPdfBase64 } from './contractPdf';

const params = {
  clientId: 7, nombre: 'Prueba Uno', domicilio: 'Calle 1, Hermosillo', curp: '', claveElector: '',
  fechaNacimiento: '01/01/1990', documentType: 'INE', isVerified: true, confidenceScore: 0.9,
  acceptedAtISO: '2026-11-19T12:00:00Z', signatureDataUrl: '', hasPhysicalPagare: true, signerRole: 'lender' as const,
};

const decode = (b64: string) => atob(b64);

describe('KYC document PDFs', () => {
  it.each([
    ['contrato', generateContractPdfBase64, 'GMO Prestamos'],
    ['pagaré', generatePagarePdfBase64, 'Suscriptor'],
    ['constancia', generateResguardoPdfBase64, 'RESGUARDO DEL PAGAR'],
  ])('%s carries its legal text', (_name, generate, needle) => {
    const pdf = decode(generate(params));
    expect(pdf.startsWith('%PDF')).toBe(true);
    expect(pdf).toContain(needle);
  });
});
