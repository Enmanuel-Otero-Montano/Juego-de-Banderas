import { useI18n } from '../i18n';

const flagSources = import.meta.glob('../../node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const flagSource = (code: string) => flagSources[`../../node_modules/flag-icons/flags/4x3/${code}.svg`];

const loadedFlags = new Map<string, Promise<void>>();

export const preloadFlags = (codes: string[]): Promise<void> => Promise.all([...new Set(codes)].map((code) => {
  let loaded = loadedFlags.get(code);
  if (!loaded) {
    loaded = new Promise<void>((resolve, reject) => {
      const source = flagSource(code);
      if (!source) { reject(new Error(`Missing flag: ${code}`)); return; }
      const image = new Image();
      image.onload = () => {
        if (image.decode) void image.decode().then(resolve, reject);
        else resolve();
      };
      image.onerror = () => reject(new Error(`Could not load flag: ${code}`));
      image.src = source;
    }).catch((error) => { loadedFlags.delete(code); throw error; });
    loadedFlags.set(code, loaded);
  }
  return loaded;
})).then(() => undefined);

interface FlagProps {
  code: string;
  name: string;
  size?: 'small' | 'medium' | 'large' | 'hero';
}

export function Flag({ code, name, size = 'medium' }: FlagProps) {
  const { t } = useI18n();
  return <img className={`flag flag--${size}`} src={flagSource(code)} alt={t('flag.aria', { country: name })} />;
}
