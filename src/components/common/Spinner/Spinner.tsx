import React from 'react';
import './Spinner.scss';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text }) => {
  return (
    <div className="spinner-wrap">
      <div className={`spinner-ring ${size !== 'md' ? `spinner-ring--${size}` : ''}`} />
      {text && <p>{text}</p>}
    </div>
  );
};