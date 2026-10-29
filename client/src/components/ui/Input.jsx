import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({ 
  label, 
  error, 
  helperText, 
  id,
  fullWidth = true,
  className = '',
  icon: Icon,
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`ui-input-wrapper ${fullWidth ? 'ui-input-wrapper--full' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="ui-input-label">{label}</label>}
      <div className="ui-input-container">
        {Icon && <span className="ui-input-icon"><Icon size={18} /></span>}
        <input 
          id={inputId}
          ref={ref}
          className={`ui-input ${error ? 'ui-input--error' : ''} ${Icon ? 'ui-input--with-icon' : ''}`}
          {...props} 
        />
      </div>
      {(error || helperText) && (
        <p className={`ui-input-helper ${error ? 'ui-input-helper--error' : ''}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
