import './Badge.css';

const variantMap = {
  hadir: 'success',
  izin: 'warning',
  sakit: 'info',
  alpa: 'danger',
  success: 'success',
  warning: 'warning',
  info: 'info',
  danger: 'danger',
  primary: 'primary',
  default: 'default',
};

export default function Badge({ children, variant = 'default', size = 'md' }) {
  const resolvedVariant = variantMap[variant] || 'default';
  return (
    <span className={`ui-badge ui-badge--${resolvedVariant} ui-badge--${size}`}>
      {children}
    </span>
  );
}
