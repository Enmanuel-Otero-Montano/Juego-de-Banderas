interface FlagProps {
  code: string;
  name: string;
  size?: 'small' | 'medium' | 'large' | 'hero';
}

export function Flag({ code, name, size = 'medium' }: FlagProps) {
  const { t } = useI18n();
  return (
    <span
      className={`fi fi-${code} flag flag--${size}`}
      role="img"
      aria-label={t('flag.aria', { country: name })}
    />
  );
}
import { useI18n } from '../i18n';
