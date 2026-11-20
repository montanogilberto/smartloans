import { API_BASE_URL } from '../utils/appEnv';

// Client addresses by source (smartloans_backend routes_/address.py):
//   ine — the Domicilio read off the INE (as corrected on "Tus datos"); goes into the contract.
//   gps — reverse-geocoded from the presence capture, with its coordinates.
// One active row per client and source: saving again updates it.
// Addresses are personal data: always in the POST body, never in the URL or logs.

export type AddressSource = 'ine' | 'gps';

export interface ClientAddress {
  addressId: number;
  companyId: number;
  clientId: number;
  clientFaceRecognitionId: number | null;
  source: AddressSource;
  fullAddress: string;
  street: string;
  postalCode: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAddressInput {
  companyId: number;
  clientId: number;
  source: AddressSource;
  fullAddress: string;
  clientFaceRecognitionId?: number;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
}

/** POST /addresses (action 1): upserts the active row of that client and source; returns its addressId. */
export async function saveClientAddress(input: SaveAddressInput): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses: [{ action: 1, ...input, fullAddress: input.fullAddress.trim().slice(0, 500) }] }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || data.error || `No se pudo guardar el domicilio (${res.status})`);
  }
  return Number(data.value);
}

/** POST /addresses/client: the client's active addresses (ine first, then gps). */
export async function getClientAddresses(companyId: number, clientId: number): Promise<ClientAddress[]> {
  const res = await fetch(`${API_BASE_URL}/addresses/client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses: [{ companyId, clientId }] }),
  });
  if (!res.ok) throw new Error(`No se pudieron leer los domicilios (${res.status})`);
  const data = await res.json();
  return Array.isArray(data?.addresses) ? data.addresses : [];
}
