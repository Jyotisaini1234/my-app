import React from 'react';
import './CustomAlert.scss';

interface CustomAlertProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ message, type, onClose }) => {
  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-container" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-content alert-${type}`}>
          <div className="alert-icon">
            {type === 'success' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {type === 'error' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {type === 'warning' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {type === 'info' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <p className="alert-message">{message}</p>
          <button className="alert-close-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};