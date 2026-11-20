import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClientAddresses, saveClientAddress } from './addressesApi';

const respond = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => { vi.restoreAllMocks(); });

describe('saveClientAddress', () => {
  it('posts one upsert row in the body, never in the URL', async () => {
    const fetchMock = respond(200, { status: 'success', value: 42 });
    const id = await saveClientAddress({ companyId: 1008, clientId: 21, source: 'gps', fullAddress: '  Calle 1  ', latitude: 29.1 });
    expect(id).toBe(42);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/addresses$/);
    expect(JSON.parse(String(init?.body))).toEqual({
      addresses: [{ action: 1, companyId: 1008, clientId: 21, source: 'gps', fullAddress: 'Calle 1', latitude: 29.1 }],
    });
  });

  it('throws the backend message on an SP error', async () => {
    respond(400, { status: 'error', message: 'El domicilio está vacío.' });
    await expect(saveClientAddress({ companyId: 1008, clientId: 21, source: 'ine', fullAddress: 'x' }))
      .rejects.toThrow('El domicilio está vacío.');
  });
});

describe('getClientAddresses', () => {
  it('returns the rows, or [] when the client has none', async () => {
    respond(200, { addresses: [{ addressId: 1, source: 'ine' }] });
    expect(await getClientAddresses(1008, 21)).toHaveLength(1);
    vi.restoreAllMocks();
    respond(200, {});
    expect(await getClientAddresses(1008, 21)).toEqual([]);
  });
});
