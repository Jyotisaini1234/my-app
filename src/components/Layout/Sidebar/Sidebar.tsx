import React from 'react';
import {
  LayoutDashboard, Users, TrendingUp, History,
  Settings, BarChart3, ScrollText,
  ChevronLeft, ChevronRight, LogOut, FolderArchive,
} from 'lucide-react';
import { NavPage } from '../../../types/type';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutThunk } from '../../../store/slice/authSlice/authSlice';
import { resetClients } from '../../../store/slice/clientsSlice/clientsSlice';
import { resetTradeHistory } from '../../../store/slice/tradeHistorySlice/tradeHistorySlice';
import './Sidebar.scss';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
}

const allNavItems: { id: NavPage; label: string; icon: React.ReactNode; masterOnly?: boolean }[] = [
  { id: 'dashboard',     label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { id: 'clients',       label: 'Clients',      icon: <Users size={18} /> },
  { id: 'bulk-trading',  label: 'Bulk Trading', icon: <TrendingUp size={18} /> },
  { id: 'trade-history', label: 'Trade History',icon: <History size={18} /> },
  { id: 'order-logs',    label: 'Order Logs',   icon: <ScrollText size={18} />, masterOnly: true },
  { id: 'log-export',    label: 'Log Export',   icon: <FolderArchive size={18} />, masterOnly: true },
  { id: 'settings',      label: 'Settings',     icon: <Settings size={18} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage, onNavigate,
  collapsed = false, onToggleCollapse, mobileOpen = false,
}) => {
  const dispatch = useAppDispatch();
  const user     = useAppSelector(s => s.auth.user);
  const isMaster = user?.role === 'MASTER';

  const navItems = allNavItems.filter(item => !item.masterOnly || isMaster);

  const handleLogout = () => {
    dispatch(resetClients());
    dispatch(resetTradeHistory());
    dispatch(logoutThunk());
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>

      <div className="sidebar__logo">
        <div className="sidebar__logo-icon"><BarChart3 size={20} /></div>
        {!collapsed && (
          <div className="sidebar__logo-text">
            <h1>Investment</h1>
            <span>Trading Platform</span>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {!collapsed && <div className="sidebar__section-label">Main Menu</div>}
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar__item ${activePage === item.id ? 'sidebar__item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar__item-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__logout" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <button className="sidebar__collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};