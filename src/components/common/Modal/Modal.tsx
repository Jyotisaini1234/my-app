import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => (
  <div style={{position: 'fixed',inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex',alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
    <div  style={{ background: '#1e293b',borderRadius: '1rem', padding: '2rem', maxWidth: '600px',width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' ,color:'white'}}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}> <X size={24} />
        </button> </div>
      {children}
    </div>
  </div>
);