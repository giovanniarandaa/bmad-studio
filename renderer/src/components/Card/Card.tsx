import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  centered?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  actions,
  variant = 'primary',
  centered = false,
  icon,
  className = '',
}) => {
  const variantClass = `card--${variant}`;
  const centeredClass = centered ? 'card--centered' : '';

  return (
    <div className={`card ${variantClass} ${centeredClass} ${className}`.trim()}>
      {(title || actions || icon) && (
        <div className="card__header">
          {icon && <span className="card__header-icon">{icon}</span>}
          {title && <h3 className="card__title">{title}</h3>}
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__content">{children}</div>
    </div>
  );
};
