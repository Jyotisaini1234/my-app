import React from 'react';
import './Badge.scss';

type BadgeColor = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ color = 'default', children }) => {
  return <span className={`badge badge--${color}`}>{children}</span>;
};