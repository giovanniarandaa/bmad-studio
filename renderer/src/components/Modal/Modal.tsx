import React, { useEffect } from 'react';
import { Button } from '../Button';
import './Modal.css';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback when modal should close */
  onClose: () => void;

  /** Modal title */
  title?: string;

  /** Modal content */
  children: React.ReactNode;

  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg';

  /** Primary action button label */
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger';
  };

  /** Secondary action button label (typically Cancel) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;

  /** Custom className */
  className?: string;
}

/**
 * Modal Component
 *
 * Displays content in a centered overlay with optional title, actions, and backdrop.
 *
 * @example
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Delete Project"
 *   primaryAction={{ label: 'Delete', onClick: handleDelete, variant: 'danger' }}
 *   secondaryAction={{ label: 'Cancel', onClick: () => setShowModal(false) }}
 * >
 *   <p>Are you sure you want to delete this project?</p>
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  primaryAction,
  secondaryAction,
  closeOnOverlayClick = true,
  className = '',
}) => {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClass = `modal__content--${size}`;

  return (
    <div
      className="modal__overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={`modal__content ${sizeClass} ${className}`.trim()}>
        {/* Header */}
        {title && (
          <div className="modal__header">
            <h2 id="modal-title" className="modal__title">
              {title}
            </h2>
            <button
              className="modal__close"
              onClick={onClose}
              aria-label="Close modal"
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="modal__body">{children}</div>

        {/* Footer with actions */}
        {(primaryAction || secondaryAction) && (
          <div className="modal__footer">
            {secondaryAction && (
              <Button
                label={secondaryAction.label}
                onClick={secondaryAction.onClick}
                variant="secondary"
                size="md"
              />
            )}
            {primaryAction && (
              <Button
                label={primaryAction.label}
                onClick={primaryAction.onClick}
                variant={primaryAction.variant || 'primary'}
                size="md"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
