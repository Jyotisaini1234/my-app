import React from 'react';
import { User, TrendingUp, Activity } from 'lucide-react';
import { TabType } from '../../../types/type';

interface TabsProps {
  activeTab: TabType;
  logsCount: number;
  onTabChange: (tab: TabType) => void;
}

const Tab = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1rem 1.5rem',
      background: 'transparent', 
      border: 'none', 
      borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent', 
      color: active ? '#3b82f6' : '#94a3b8', 
      cursor: 'pointer',
      fontSize: '1rem', 
      fontWeight: active ? 'bold' : 'normal', 
      transition: 'all 0.2s'
    }}
  > 
    {icon} {label} 
  </button>
);

export const Tabs: React.FC<TabsProps> = ({ activeTab, logsCount, onTabChange }) => (
  <nav style={{ background: '#1e293b', borderBottom: '2px solid #334155' }}>
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex' }}>
      <Tab icon={<User />} label="Clients" active={activeTab === 'clients'} onClick={() => onTabChange('clients')} />
      <Tab icon={<TrendingUp />} label="Orders" active={activeTab === 'orders'} onClick={() => onTabChange('orders')} />
      <Tab icon={<Activity />} label={`Trade Logs (${logsCount})`} active={activeTab === 'logs'} onClick={() => onTabChange('logs')} />
    </div>
  </nav>
);

