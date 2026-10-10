/**
 * El archivo original puede pesar hasta 5 MiB. La API lo redimensiona y
 * recodifica antes de persistirlo, por lo que no se guarda ese peso completo.
 */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const SUPPORTED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png']);

export type AvatarValidationError = 'type' | 'size';

/** Replica en el dispositivo las restricciones de seguridad de la API. */
export const validateAvatarFile = (file: File): AvatarValidationError | null => {
  if (!SUPPORTED_AVATAR_TYPES.has(file.type)) return 'type';
  if (file.size > MAX_AVATAR_BYTES) return 'size';
  return null;
};
