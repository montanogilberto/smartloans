import { describe, it, expect } from 'vitest';
import { frontSelfieUrl } from './selfie';

describe('frontSelfieUrl', () => {
  it("swaps the client's own selfie for the front-facing pose in the same folder", () => {
    expect(frontSelfieUrl('https://x.blob.core.windows.net/clients/3371/selfies/selfie.jpg'))
      .toBe('https://x.blob.core.windows.net/clients/3371/selfies/selfie_front.jpg');
    expect(frontSelfieUrl('https://x/clients/42/selfies/selfie.jpg?v=2'))
      .toBe('https://x/clients/42/selfies/selfie_front.jpg?v=2');
  });

  it('also repairs records that stored a pose photo as the selfie', () => {
    expect(frontSelfieUrl('https://x/clients/3371/selfies/selfie_left.jpg'))
      .toBe('https://x/clients/3371/selfies/selfie_front.jpg');
    expect(frontSelfieUrl('https://x/clients/3371/selfies/selfie_down.jpg?v=1'))
      .toBe('https://x/clients/3371/selfies/selfie_front.jpg?v=1');
  });

  it('leaves other URLs alone (old date-partitioned layout, pose photos)', () => {
    expect(frontSelfieUrl('https://x/clients/2026/07/selfie_42_ab.jpg')).toBe('https://x/clients/2026/07/selfie_42_ab.jpg');
    expect(frontSelfieUrl('https://x/clients/42/selfies/selfie_front.jpg')).toBe('https://x/clients/42/selfies/selfie_front.jpg');
    expect(frontSelfieUrl(undefined)).toBeUndefined();
  });
});
