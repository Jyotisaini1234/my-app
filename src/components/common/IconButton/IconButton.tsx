import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, title }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <button  onClick={onClick} title={title} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}style={{padding: '0.5rem', background: isHovered ? '#475569' : '#334155', border: 'none',borderRadius: '0.375rem', color: '#e2e8f0',cursor: 'pointer',transition: 'all 0.2s' }}> {icon} </button>
  );
};