import { ClientCapability } from '../../../api/clientCapabilitiesApi';
import { ProductContext } from '../../../utils/productContext';

export interface EnrollOption {
  capability: ClientCapability;
  /** Product context it opens — where the client lands right after enrolling. */
  product: ProductContext;
  label: string;
  desc: string;
  /** What happens right after enrolling — shown before the client confirms. */
  next: string;
}

export const ENROLL_TITLE = 'Activa GMO Prestamos';

// SmartLoans is its own app: no mention of POS purchases or rewards here.
export const ENROLL_INTRO = 'Elige cómo quieres usar GMO Prestamos.';

export const ENROLL_OPTIONS: EnrollOption[] = [
  {
    capability: 'SMARTLOANS_BORROWER',
    product: 'borrower',
    label: 'Acreditado',
    desc: 'Solicita préstamos a otros clientes.',
    next: 'Verificarás tu identificación y rostro, firmarás pagaré y contrato, y registrarás la CLABE donde recibirás tu préstamo.',
  },
  {
    capability: 'SMARTLOANS_LENDER',
    product: 'lender',
    label: 'Prestamista',
    desc: 'Presta tu dinero y recibe pagos con interés.',
    next: 'Verificarás tu identidad y registrarás la cuenta donde recibirás tus pagos.',
  },
  {
    capability: 'SMARTLOANS_JURIDICAL',
    product: 'juridical',
    label: 'Jurídico',
    desc: 'Asesoría legal para acreditados y prestamistas.',
    next: 'Verificarás tu identidad y firmarás tu contrato de servicios; el equipo te asigna casos en tu panel jurídico.',
  },
];

export const ENROLL_TERMS = [
  'Autorizo el tratamiento de mis datos personales, incluidos datos biométricos, conforme a la LFPDPPP y el Aviso de Privacidad de GMO Prestamos.',
  'Entiendo que cada préstamo requiere firmar pagaré y contrato dentro de la plataforma.',
];
