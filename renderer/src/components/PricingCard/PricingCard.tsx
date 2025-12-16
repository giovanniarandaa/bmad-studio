import React from 'react';
import { Button } from '../Button';
import './PricingCard.css';

export interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
  onCTA: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  features,
  ctaLabel,
  onCTA,
}) => {
  return (
    <div className="pricing-card">
      <div className="pricing-card__header">
        <span className="pricing-card__badge">PRO</span>
        <h3 className="pricing-card__title">{title}</h3>
      </div>

      <div className="pricing-card__pricing">
        <span className="pricing-card__price">{price}</span>
        <span className="pricing-card__period">/{period}</span>
      </div>

      <ul className="pricing-card__features">
        {features.map((feature, index) => (
          <li key={index} className="pricing-card__feature">
            <span className="pricing-card__feature-icon">✓</span>
            <span className="pricing-card__feature-text">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="pricing-card__cta">
        <Button label={ctaLabel} onClick={onCTA} variant="primary" />
      </div>
    </div>
  );
};
