import React from 'react';
import './IconButton.scss';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  variant?: 'default' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  title,
  variant = 'default',
}) => {
  return (
    <button
      className={`icon-btn ${variant === 'danger' ? 'icon-btn--danger' : ''}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );
};