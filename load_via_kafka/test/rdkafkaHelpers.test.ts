import { decodeKey } from '../src/rdkafkaHelpers';

describe('decodeKey', () => {
  it('returns the string if the key is a string', () => {
    expect(decodeKey('hello')).toBe('hello');
  });
  it('decodes a Buffer to a string', () => {
    const buffer = Buffer.from('my-buffer-key', 'utf-8');
    expect(buffer).toBe(buffer);
  });
  it('returns undefined if the key is undefined', () => {
    expect(decodeKey(undefined)).toBe(undefined);
  });
  it('returns undefined if key is null', () => {
    expect(decodeKey(null)).toBe(undefined);
  });
});
