import { describe, expect, it } from 'vitest';
import { resolveTheme } from './theme';

describe('tema', () => {
  it('sigue al sistema solo cuando la preferencia es sistema', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
