import { describe, expect, it } from 'vitest';
import { atlasCellState, parseFlagAtlas, visibleAtlas } from './atlas';
import { countries } from './data/countries';

describe('atlas oficial', () => {
  const code = countries[0].code;

  it('ignora países desconocidos y recorta totales imposibles', () => {
    const atlas = parseFlagAtlas({
      flags: {
        [code]: { seen: 2, correct: 9, wrong: 9 },
        zz: { seen: 4, correct: 4, wrong: 0 },
        [countries[1].code]: { seen: 0, correct: 1, wrong: 0 },
      },
    });
    expect(atlas.flags[code]).toEqual({ seen: 2, correct: 2, wrong: 0 });
    expect(atlas.flags.zz).toBeUndefined();
    expect(atlas.flags[countries[1].code]).toBeUndefined();
  });

  it('no marca descubiertas sin sesión', () => {
    const atlas = parseFlagAtlas({ flags: { [code]: { seen: 1, correct: 1, wrong: 0 } } });
    expect(atlasCellState(atlas.flags[code])).toBe('discovered');
    expect(visibleAtlas(false, atlas).flags).toEqual({});
    expect(atlasCellState(undefined)).toBe('unseen');
  });
});
