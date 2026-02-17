import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.scss';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'narrow' | 'default' | 'wide';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  onClose,
  children,
  size = 'default',
  footer,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${size !== 'default' ? `modal--${size}` : ''}`}>
        <div className="modal__header">
          <h3>{title}</h3>
          <button className="modal__header-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};