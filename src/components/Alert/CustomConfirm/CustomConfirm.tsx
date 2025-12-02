import React from 'react';
import './CustomConfirm.scss';

interface CustomConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirm: React.FC<CustomConfirmProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-container" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-content">
          <div className="confirm-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="confirm-message">{message}</p>
          <div className="confirm-buttons">
            <button className="confirm-btn confirm-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="confirm-btn confirm-yes" onClick={onConfirm}>
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};