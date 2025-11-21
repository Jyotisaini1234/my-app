import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'secondary';
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ children, icon, onClick, disabled = false, variant = 'primary',  style = {} }) => {
  const colors = {
    primary: { bg: '#3b82f6', hover: '#2563eb' },
    success: { bg: '#10b981', hover: '#059669' },
    secondary: { bg: '#475569', hover: '#334155' }
  };
  
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <button onClick={onClick} disabled={disabled}onMouseEnter={() => setIsHovered(true)}onMouseLeave={() => setIsHovered(false)} style={{ display: 'flex',alignItems: 'center',gap: '0.5rem',padding: '0.75rem 1.5rem',background: isHovered && !disabled ? colors[variant].hover : colors[variant].bg, color: 'white', border: 'none',borderRadius: '0.5rem',fontSize: '1rem',fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,transition: 'all 0.2s',...style}} >
      {icon} {children}
    </button>
  );
};