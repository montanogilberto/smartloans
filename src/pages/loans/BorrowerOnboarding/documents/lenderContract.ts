/**
 * Contrato de Crédito — Prestamista ↔ GMO Prestamos. The one document a lender
 * signs at KYC (borrowers sign contract.ts + pagare.ts + resguardo.ts with
 * their lender). Documento legal estático, separado de la UI (misma razón que
 * pagare.ts); the blanks are filled by fill.ts.
 */
export const LENDER_CONTRACT_TEXT = `CONTRATO DE CRÉDITO — PRESTAMISTA / GMO PRESTAMOS

Ciudad de México, a _______________

PARTES:
- GMO PRESTAMOS: plataforma tecnológica de préstamos entre particulares (en adelante "la Plataforma").
- PRESTAMISTA: _________________________________ (en adelante "el Prestamista").

PRIMERA — OBJETO: La Plataforma pone a disposición del Prestamista los medios tecnológicos para publicar ofertas de crédito personal y otorgarlas a los Prestatarios registrados y verificados en GMO Prestamos, en los montos, tasas y plazos que el propio Prestamista determine en cada oferta.

SEGUNDA — CRÉDITOS ENTRE PARTICULARES: Cada crédito se celebra directamente entre el Prestamista y el Prestatario, mediante el Contrato de Crédito, el Pagaré y la Constancia de Resguardo que el Prestatario firma a favor del Prestamista. La Plataforma no es parte acreditante ni acreditada de dichos créditos.

TERCERA — PLATAFORMA NO CUSTODIA: La Plataforma no recibe, retiene ni transfiere dinero del Prestamista ni de los Prestatarios. Los desembolsos y los pagos se realizan directamente entre las partes mediante transferencia SPEI a las cuentas CLABE registradas. La Plataforma únicamente registra la evidencia de cada operación (clave de rastreo o Comprobante Electrónico de Pago de Banxico) y la confirmación de quien recibe el pago.

CUARTA — CUENTAS CLABE: El Prestamista registra en la Plataforma una cuenta CLABE a su nombre. La Plataforma muestra la CLABE completa únicamente a la contraparte de cada crédito, junto con el nombre del titular esperado, y deja registro de cada consulta. Antes de desembolsar, el Prestamista debe verificar que el nombre del titular que muestra su banco coincida con el que indica la Plataforma; si no coincide, no debe realizar la transferencia y debe reportarlo en la Plataforma.

QUINTA — COMISIONES DE LA PLATAFORMA: Las comisiones por el uso de la Plataforma son independientes de los créditos. El Prestamista las paga directamente a la Plataforma dentro de la aplicación, y nunca se descuentan de los créditos que otorga ni de los pagos que recibe de los Prestatarios. El monto de cada comisión se muestra al Prestamista antes de que la pague.

SEXTA — OBLIGACIONES DEL PRESTAMISTA:
a) Mantener vigentes su identificación, datos biométricos y cuenta CLABE registrados en la Plataforma.
b) Otorgar únicamente los créditos que haya publicado y aceptado dentro de la Plataforma.
c) Desembolsar el crédito una vez aceptado y confirmar en la Plataforma cada pago recibido.
d) Declarar que los recursos que presta son de procedencia lícita.

SÉPTIMA — RIESGO: El Prestamista reconoce que todo crédito implica riesgo de incumplimiento del Prestatario y que la Plataforma no garantiza el pago de los créditos que otorgue.

OCTAVA — DATOS PERSONALES: El Prestamista consiente expresamente el tratamiento de sus datos personales, incluyendo datos biométricos, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y el Aviso de Privacidad de GMO Prestamos.

NOVENA — JURISDICCIÓN: Para todo lo no previsto en este contrato, las partes se sujetan al Código de Comercio y la legislación aplicable vigente en los Estados Unidos Mexicanos.

Al aceptar digitalmente, el Prestamista reconoce haber leído, entendido y aceptado la totalidad de las cláusulas del presente contrato.`;
