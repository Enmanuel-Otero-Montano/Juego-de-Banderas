import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const shareWasCanceled = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return error instanceof Error && error.message === 'Share canceled';
};

export const shareResult = async (title: string, text: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, dialogTitle: title });
    return;
  }
  if (typeof navigator.share === 'function') {
    await navigator.share({ title, text });
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('Clipboard unavailable');
};
