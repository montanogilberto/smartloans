import { describe, expect, it } from 'vitest';
import { detectCardBounds } from './documentCaptureAnalysis';

type Rgb = [number, number, number];

function makeImageData(width: number, height: number, fill: (x: number, y: number) => Rgb): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fill(x, y);
      const p = (y * width + x) * 4;
      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = b;
      data[p + 3] = 255;
    }
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

const inBox = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) =>
  x >= x0 && x < x1 && y >= y0 && y < y1;

describe('detectCardBounds', () => {
  it('finds a light card on a dark surface (portrait photo)', () => {
    // 300x400 photo, card 270x170 starting at (15, 200).
    const img = makeImageData(300, 400, (x, y) => (inBox(x, y, 15, 200, 285, 370) ? [225, 225, 220] : [20, 20, 25]));
    const b = detectCardBounds(img)!;
    expect(b).not.toBeNull();
    // Padded by 3% but must contain the card and stay close to it.
    expect(b.x).toBeLessThanOrEqual(15 / 300);
    expect(b.y).toBeLessThanOrEqual(200 / 400);
    expect(b.x + b.width).toBeGreaterThanOrEqual(285 / 300);
    expect(b.y + b.height).toBeGreaterThanOrEqual(370 / 400);
    expect(b.y).toBeGreaterThan(0.4);
    expect(b.height).toBeLessThan(0.55);
  });

  it('prefers the card-shaped block over a full-width bright band', () => {
    // Bright band across the top (wall), dark gap, then the card.
    const img = makeImageData(300, 400, (x, y) => {
      if (y < 120) return [200, 200, 210];
      if (inBox(x, y, 20, 220, 280, 384)) return [230, 230, 225];
      return [15, 15, 15];
    });
    const b = detectCardBounds(img)!;
    expect(b).not.toBeNull();
    expect(b.y).toBeGreaterThan(0.45);
  });

  it('returns null when nothing card-shaped is in the photo', () => {
    const img = makeImageData(300, 400, () => [30, 30, 30]);
    expect(detectCardBounds(img)).toBeNull();
  });
});
