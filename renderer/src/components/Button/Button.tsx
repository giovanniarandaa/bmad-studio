import React from 'react';
import './Button.css';

export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
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
  const sizeClass = `button--${size}`;
  const disabledClass = disabled ? 'button--disabled' : '';

  return (
    <button
      className={`button ${variantClass} ${sizeClass} ${disabledClass} ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
      type="button"
    >
      {icon && <span className="button__icon">{icon}</span>}
      <span className="button__label">{label}</span>
    </button>
  );
};
