import { useCallback, useState } from 'react';
import { readTransferEvidence, TransferReading } from '../api/transferReadingApi';

/** Amounts within 1 peso count as the same (receipts round differently). */
const AMOUNT_TOLERANCE_MXN = 1;

export interface TransferReadingResult {
  reading: TransferReading;
  /** The receipt's amount differs from what this transfer should be. */
  amountMismatch: boolean;
}

/**
 * Reads a SPEI receipt photo with the transfer_extraction agent and fills the
 * declaration form — only fields the person left EMPTY, never overwriting what
 * they typed. Shared by LoanDetail's and P2P's "Ya transferí" forms.
 */
export function useTransferReading() {
  const [reading, setReading] = useState<TransferReading | null>(null);
  const [readingBusy, setReadingBusy] = useState(false);
  const [readingFailed, setReadingFailed] = useState(false);
  const [expectedAmount, setExpectedAmount] = useState<number | null>(null);

  const read = useCallback(async (
    imageDataUrl: string,
    opts: {
      expectedAmountMXN?: number;
      current: { claveRastreo: string; bankFrom: string };
      fill: { claveRastreo: (v: string) => void; bankFrom: (v: string) => void };
    },
  ): Promise<void> => {
    setReadingBusy(true);
    setReadingFailed(false);
    setReading(null);
    setExpectedAmount(opts.expectedAmountMXN ?? null);
    try {
      const r = await readTransferEvidence(imageDataUrl);
      if (!r) { setReadingFailed(true); return; }
      console.log('[TransferReading] read', {
        isTransferReceipt: r.isTransferReceipt, confidence: r.confidence,
        hasClave: !!r.claveRastreo, hasBank: !!r.bankFrom, needsReview: r.needsReview,
      });
      setReading(r);
      if (!r.isTransferReceipt) return;
      if (r.claveRastreo && !opts.current.claveRastreo.trim()) opts.fill.claveRastreo(r.claveRastreo.trim());
      if (r.bankFrom && !opts.current.bankFrom.trim()) opts.fill.bankFrom(r.bankFrom.trim());
    } finally {
      setReadingBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    setReading(null);
    setReadingFailed(false);
    setExpectedAmount(null);
  }, []);

  const result: TransferReadingResult | null = reading
    ? {
        reading,
        amountMismatch: expectedAmount != null && reading.amountMXN > 0
          && Math.abs(reading.amountMXN - expectedAmount) > AMOUNT_TOLERANCE_MXN,
      }
    : null;

  return { result, readingBusy, readingFailed, read, reset };
}
