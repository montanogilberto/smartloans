// Comprobante READING — POST /transfers/extract-evidence on the LoanAgents
// service (transfer_extraction agent). Reads a SPEI receipt photo so the
// declaration form fills itself in. Advisory only: it suggests values, the
// person reviews them, and /validate-transfer-evidence (transferEvidenceAgentApi)
// still checks the receipt against what was finally declared.
// Same endpoint POSVending's cashier top-ups use (api/transferReadingApi.ts there).
import { AGENT_BASE } from './transferEvidenceAgentApi';

export interface TransferReading {
  isTransferReceipt: boolean;
  confidence: number;
  amountMXN: number;
  claveRastreo: string;
  transferDate: string;
  bankFrom: string;
  issues: string[];
  needsReview: boolean;
}

const READ_TIMEOUT_MS = 60_000;

/** null when the agent can't be reached: the person then types the form by hand. */
export const readTransferEvidence = async (imageBase64: string): Promise<TransferReading | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
  try {
    const res = await fetch(`${AGENT_BASE}/transfers/extract-evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceBase64: imageBase64 }),
      signal: controller.signal,
    });
    // Status only — the receipt holds account data, never log its contents.
    console.log('[TransferReading] HTTP', res.status);
    return res.ok ? await res.json() : null;
  } catch (err) {
    console.log('[TransferReading] failed:', String(err));
    return null;
  } finally {
    clearTimeout(timer);
  }
};
