import React from 'react';
import './Button.css';

export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  icon,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  const variantClass = `button--${variant}`;
  const disabledClass = disabled ? 'button--disabled' : '';

  return (
    <button
      className={`button ${variantClass} ${disabledClass} ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
      type="button"
    >
      {icon && <span className="button__icon">{icon}</span>}
      <span className="button__label">{label}</span>
    </button>
  );
};
