import React from 'react';
import { Card } from '../Card';
import './FeatureCard.css';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card variant="primary" centered className={`feature-card ${onClick ? 'feature-card--clickable' : ''}`.trim()}>
      <div className="feature-card__content" onClick={handleClick}>
        <div className="feature-card__icon">{icon}</div>
        <h3 className="feature-card__title">{title}</h3>
        {description && <p className="feature-card__description">{description}</p>}
      </div>
    </Card>
  );
};
