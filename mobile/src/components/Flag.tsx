import { useI18n } from '../i18n';

const flagSources = import.meta.glob('../../node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const flagSource = (code: string) => flagSources[`../../node_modules/flag-icons/flags/4x3/${code}.svg`];

interface FlagProps {
  code: string;
  name: string;
  size?: 'small' | 'medium' | 'large' | 'hero';
}

export function Flag({ code, name, size = 'medium' }: FlagProps) {
  const { t } = useI18n();
  return <img className={`flag flag--${size}`} src={flagSource(code)} alt={t('flag.aria', { country: name })} />;
}
