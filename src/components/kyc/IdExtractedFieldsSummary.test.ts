import { describe, expect, it } from 'vitest';
import { fieldStatus } from './IdExtractedFieldsSummary';
import { ExtractedIdFields } from '../../utils/idOcr';

const fields = { nombre: 'ANA PEREZ', domicilio: '   ', curp: 'X' } as unknown as ExtractedIdFields;

describe('fieldStatus', () => {
  it('is read when the field has a value', () => {
    expect(fieldStatus(fields, 'nombre', [])).toBe('read');
  });
  it('is check when it has a value the agent was unsure about', () => {
    expect(fieldStatus(fields, 'curp', ['curp'])).toBe('check');
  });
  it('is missing when empty or only spaces', () => {
    expect(fieldStatus(fields, 'domicilio', [])).toBe('missing');
    expect(fieldStatus(fields, 'claveElector', ['claveElector'])).toBe('missing');
  });
});
