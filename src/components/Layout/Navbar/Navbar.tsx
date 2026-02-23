import React from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import { NavPage } from '../../../types/type';
import { useAppSelector } from '../../../store/hooks';
import './Navbar.scss';

const pageTitles: Record<NavPage, string> = {
  dashboard:      'Dashboard',
  clients:        'Client Management',
  'bulk-trading': 'Bulk Trading',
  'trade-history':'Trade History',
  settings:       'Settings',
  'order-logs':   'Order Logs',
};

interface NavbarProps {
  activePage: NavPage;
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onMenuToggle }) => {
  const user = useAppSelector(s => s.auth.user);
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'U';

  return (
    <header className="navbar">
      <div className="navbar__left">
        {/* Hamburger — mobile only */}
        <button className="navbar__menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <h2 className="navbar__title">{pageTitles[activePage]}</h2>
      </div>

      <div className="navbar__right">
        <div className="navbar__search">
          <Search size={14} />
          <input placeholder="Search..." />
        </div>

        <button className="navbar__icon-btn" aria-label="Notifications">
          <Bell size={16} />
        </button>

        <div className="navbar__user">
          <div className="navbar__user-avatar">{initials}</div>
          <div className="navbar__user-info">
            <strong>{user?.name || 'User'}</strong>
            <span>{user?.role || 'Advisor'}</span>
          </div>
          <ChevronDown size={14} className="navbar__user-caret" />
        </div>
      </div>
    </header>
  );
};