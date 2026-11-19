import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransferReading } from './useTransferReading';
import { readTransferEvidence, TransferReading } from '../api/transferReadingApi';

vi.mock('../api/transferReadingApi', () => ({ readTransferEvidence: vi.fn() }));
const mockRead = vi.mocked(readTransferEvidence);

const receipt = (over: Partial<TransferReading> = {}): TransferReading => ({
  isTransferReceipt: true, confidence: 0.9, amountMXN: 5000, claveRastreo: 'MBAN0123',
  transferDate: '2026-11-19', bankFrom: 'BBVA', issues: [], needsReview: false, ...over,
});

const setup = () => {
  const fill = { claveRastreo: vi.fn(), bankFrom: vi.fn() };
  const hook = renderHook(() => useTransferReading());
  return { hook, fill };
};

describe('useTransferReading', () => {
  beforeEach(() => { mockRead.mockReset(); });

  it('fills empty fields from the receipt', async () => {
    mockRead.mockResolvedValue(receipt());
    const { hook, fill } = setup();
    await act(() => hook.result.current.read('data:image/jpeg;base64,AA', {
      expectedAmountMXN: 5000, current: { claveRastreo: '', bankFrom: '' }, fill,
    }));
    expect(fill.claveRastreo).toHaveBeenCalledWith('MBAN0123');
    expect(fill.bankFrom).toHaveBeenCalledWith('BBVA');
    expect(hook.result.current.result?.amountMismatch).toBe(false);
  });

  it('never overwrites what the person typed', async () => {
    mockRead.mockResolvedValue(receipt());
    const { hook, fill } = setup();
    await act(() => hook.result.current.read('x', {
      current: { claveRastreo: 'TYPED', bankFrom: 'Banorte' }, fill,
    }));
    expect(fill.claveRastreo).not.toHaveBeenCalled();
    expect(fill.bankFrom).not.toHaveBeenCalled();
  });

  it('flags an amount that differs from the loan', async () => {
    mockRead.mockResolvedValue(receipt({ amountMXN: 4500 }));
    const { hook, fill } = setup();
    await act(() => hook.result.current.read('x', {
      expectedAmountMXN: 5000, current: { claveRastreo: '', bankFrom: '' }, fill,
    }));
    expect(hook.result.current.result?.amountMismatch).toBe(true);
  });

  it('fills nothing when the photo is not a transfer receipt', async () => {
    mockRead.mockResolvedValue(receipt({ isTransferReceipt: false }));
    const { hook, fill } = setup();
    await act(() => hook.result.current.read('x', { current: { claveRastreo: '', bankFrom: '' }, fill }));
    expect(fill.claveRastreo).not.toHaveBeenCalled();
  });

  it('reports a failure when the agent is unreachable', async () => {
    mockRead.mockResolvedValue(null);
    const { hook, fill } = setup();
    await act(() => hook.result.current.read('x', { current: { claveRastreo: '', bankFrom: '' }, fill }));
    expect(hook.result.current.readingFailed).toBe(true);
    expect(hook.result.current.readingBusy).toBe(false);
  });
});
