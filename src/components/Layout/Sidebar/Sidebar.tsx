import React from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  History,
  Settings,
  BarChart3,
} from 'lucide-react';
import { NavPage } from '../../../types/type';
import './Sidebar.scss';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: <LayoutDashboard size={18} /> },
  { id: 'clients',       label: 'Clients',        icon: <Users size={18} /> },
  { id: 'bulk-trading',  label: 'Bulk Trading',   icon: <TrendingUp size={18} /> },
  { id: 'trade-history', label: 'Trade History',  icon: <History size={18} /> },
  { id: 'settings',      label: 'Settings',       icon: <Settings size={18} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <BarChart3 size={20} />
        </div>
        <div className="sidebar__logo-text">
          <h1>Investment</h1>
          <span>Trading Platform</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-label">Main Menu</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar__item ${activePage === item.id ? 'sidebar__item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="broker-badge">
          <div className="broker-badge__dot" />
          <div className="broker-badge__text">
            <strong>Motilal Oswal</strong>
            API Connected
          </div>
        </div>
      </div>
    </aside>
  );
};