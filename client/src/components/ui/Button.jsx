import './Button.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  isLoading = false,
  className = '',
  ...props 
}) {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth ? 'ui-button--full' : '',
    isLoading ? 'ui-button--loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <span className="ui-button__spinner" /> : null}
      {children}
    </button>
  );
}
