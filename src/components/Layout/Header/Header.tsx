import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Client } from '../../../types/type';
import './Header.scss';

interface HeaderProps {
  clients: Client[];
}

interface StatProps {
  label: string;
  value: number;
  success?: boolean;
}

const Stat: React.FC<StatProps> = ({ label, value, success = false }) => (
  <div className={`stat ${success ? 'stat--success' : ''}`}>
    <div className="stat__label">{label}</div>
    <div className="stat__value">{value}</div>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ clients }) => {
  const activeCount = clients.filter(c => c.is_active).length;
  const authCount = clients.filter(c => c.is_authenticated).length;

  return (
    <header className="header">
      <div className="header__content">
        <h1 className="header__title">
          <BarChart3 className="header__icon" />
          <span className="header__title-text">Trading Automation</span>
        </h1>
        <div className="header__stats">
          <Stat label="Total Clients" value={clients.length} />
          <Stat label="Active" value={activeCount} />
          <Stat label="Authenticated" value={authCount} success />
        </div>
      </div>
    </header>
  );
};