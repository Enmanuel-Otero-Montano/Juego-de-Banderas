/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { isBackdropPreference, loadBackdropPreference } from './backdrop';

describe('fondo de la partida', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('usa el color fijo del tema cuando no hay preferencia guardada', () => {
    expect(loadBackdropPreference()).toBe('fixed');
    expect(isBackdropPreference('varied')).toBe(true);
    expect(isBackdropPreference('fixed')).toBe(true);
    expect(isBackdropPreference('otro')).toBe(false);
  });

  it('recuerda colores variados o el color fijo', () => {
    localStorage.setItem('atlas-flags-backdrop-v1', 'varied');
    expect(loadBackdropPreference()).toBe('varied');
    localStorage.setItem('atlas-flags-backdrop-v1', 'fixed');
    expect(loadBackdropPreference()).toBe('fixed');
    localStorage.setItem('atlas-flags-backdrop-v1', 'sistema');
    expect(loadBackdropPreference()).toBe('fixed');
  });
});
