import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, color, style = {} }) => (
  <span style={{display: 'inline-block',padding: '0.25rem 0.75rem',background: color,color: 'white',borderRadius: '9999px', fontSize: '0.75rem',  fontWeight: 'bold', ...style}}>
    {children}
  </span>
);