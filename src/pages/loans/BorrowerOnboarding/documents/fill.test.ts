import { describe, it, expect } from 'vitest';
import { fillContract, fillPagare, fillResguardo, fillJuridicalContract, DocumentFillData } from './fill';

const base: DocumentFillData = {
  nombre: 'MONTAÑO QUIHUIS GILBERTO',
  domicilio: 'Calle 1, Hermosillo, Son.',
  signerRole: 'lender',
  date: new Date(2026, 10, 19),
};

const NO_BLANKS = /_{4,}/;

describe('KYC document fill', () => {
  it("a lender's contract is with GMO Prestamos", () => {
    const t = fillContract(base);
    expect(t).toContain('CONTRATO DE CRÉDITO — PRESTAMISTA / GMO PRESTAMOS');
    expect(t).toContain('- PRESTAMISTA: MONTAÑO QUIHUIS GILBERTO');
    expect(t).toContain('- GMO PRESTAMOS:');
    expect(t).toContain('a 19 de noviembre de 2026');
    expect(t).not.toMatch(NO_BLANKS);
  });

  it('a borrower signs as Acreditado and subscribes the pagaré with their address', () => {
    const data = { ...base, signerRole: 'borrower' as const };
    expect(fillContract(data)).toContain('- ACREDITADO: MONTAÑO QUIHUIS GILBERTO (Prestatario)');
    const p = fillPagare(data);
    expect(p).toContain('Yo, MONTAÑO QUIHUIS GILBERTO');
    expect(p).toContain('con domicilio en Calle 1, Hermosillo, Son.');
    expect(p).toContain('a la orden de el Prestamista cuya oferta sea aceptada');
    expect(p).not.toMatch(NO_BLANKS);
  });

  it("the borrower's contract is with their lender", () => {
    const t = fillContract({ ...base, signerRole: 'borrower' });
    expect(t).toContain('CONTRATO DE CRÉDITO PERSONAL P2P');
    expect(t).toContain('- ACREDITANTE: el Prestamista cuya oferta sea aceptada');
    expect(fillPagare({ ...base, signerRole: 'borrower' })).toContain('SPEI directa');
  });

  it('an empty name falls back to the role wording, never a blank', () => {
    expect(fillContract({ ...base, nombre: '  ' })).not.toMatch(NO_BLANKS);
    expect(fillPagare({ ...base, signerRole: 'borrower', nombre: '', domicilio: '' })).not.toMatch(NO_BLANKS);
  });

  it("a Jurídico professional's contract is with GMO Prestamos and is non-custodial", () => {
    const t = fillJuridicalContract(base);
    expect(t).toContain('CONTRATO DE PRESTACIÓN DE SERVICIOS — PROFESIONAL JURÍDICO / GMO PRESTAMOS');
    expect(t).toContain('- PROFESIONAL JURÍDICO: MONTAÑO QUIHUIS GILBERTO');
    expect(t).toContain('a 19 de noviembre de 2026');
    expect(t).toContain('PLATAFORMA NO CUSTODIA');
    expect(t).not.toMatch(NO_BLANKS);
    expect(fillJuridicalContract({ nombre: ' ', date: base.date })).not.toMatch(NO_BLANKS);
  });

  it("a 'juridical' signer gets the services contract through fillContract", () => {
    const t = fillContract({ ...base, signerRole: 'juridical' });
    expect(t).toContain('PROFESIONAL JURÍDICO: MONTAÑO QUIHUIS GILBERTO');
    expect(t).not.toMatch(NO_BLANKS);
  });

  it('every contract states the platform is non-custodial and fees are paid in the app', () => {
    for (const t of [
      fillContract(base),
      fillContract({ ...base, signerRole: 'borrower' }),
      fillJuridicalContract(base),
    ]) {
      expect(t).toContain('PLATAFORMA NO CUSTODIA');
      expect(t).toContain('COMISIONES DE LA PLATAFORMA');
      expect(t).toContain('CUENTAS CLABE');
    }
  });

  it('dates the constancia', () => {
    const r = fillResguardo(base);
    expect(r).toContain('Lugar y Fecha: 19 de noviembre de 2026');
    expect(r).not.toMatch(NO_BLANKS);
  });
});
