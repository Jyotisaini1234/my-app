import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Client } from '../../../types/type';

interface HeaderProps {
  clients: Client[];
}

const Stat = ({ label, value, color = '#64748b' }: { label: string; value: number; color?: string }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</div>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ clients }) => {
  const activeCount = clients.filter(c => c.is_active).length;
  const authCount = clients.filter(c => c.is_authenticated).length;

  return (
    <header style={{ background: '#1e293b', padding: '1.5rem', borderBottom: '1px solid #334155' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 'bold' }}>
          <BarChart3 size={32} /> Trading Automation
        </h1>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Stat label="Total Clients" value={clients.length} />
          <Stat label="Active" value={activeCount} />
          <Stat label="Authenticated" value={authCount} color="#10b981" />
        </div>
      </div>
    </header>
  );
};