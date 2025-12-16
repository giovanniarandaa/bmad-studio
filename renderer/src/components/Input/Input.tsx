import React, { useState, ChangeEvent } from 'react';
import './Input.css';

export interface InputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  placeholder = '',
  value,
  onChange,
  type = 'text',
  disabled = false,
  error,
  icon,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const focusedClass = isFocused ? 'input-wrapper--focused' : '';
  const errorClass = error ? 'input-wrapper--error' : '';
  const disabledClass = disabled ? 'input-wrapper--disabled' : '';
  const iconClass = icon ? 'input-wrapper--with-icon' : '';

  return (
    <div className={`input-container ${className}`.trim()}>
      <div
        className={`input-wrapper ${focusedClass} ${errorClass} ${disabledClass} ${iconClass}`.trim()}
      >
        {icon && <span className="input__icon">{icon}</span>}
        <input
          className="input__field"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </div>
      {error && <span className="input__error-message">{error}</span>}
    </div>
  );
};
