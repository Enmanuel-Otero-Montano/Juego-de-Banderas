import { describe, expect, it } from 'vitest';
import { MAX_AVATAR_BYTES, validateAvatarFile } from './avatarValidation';

describe('validación local del avatar', () => {
  it('acepta PNG y JPEG de hasta 5 MiB', () => {
    expect(validateAvatarFile(new File(['avatar'], 'avatar.png', { type: 'image/png' }))).toBeNull();
    expect(validateAvatarFile(new File([new Uint8Array(MAX_AVATAR_BYTES)], 'avatar.jpg', { type: 'image/jpeg' }))).toBeNull();
  });

  it('rechaza el archivo en cuanto supera 5 MiB', () => {
    const file = new File([new Uint8Array(MAX_AVATAR_BYTES + 1)], 'avatar.png', { type: 'image/png' });
    expect(validateAvatarFile(file)).toBe('size');
  });

  it('rechaza formatos distintos de PNG y JPEG', () => {
    expect(validateAvatarFile(new File(['avatar'], 'avatar.webp', { type: 'image/webp' }))).toBe('type');
  });
});
