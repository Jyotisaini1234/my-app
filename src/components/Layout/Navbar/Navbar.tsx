import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { NavPage } from '../../../types/type';
import './Navbar.scss';

const pageTitles: Record<NavPage, string> = {
  dashboard:     'Dashboard',
  clients:       'Client Management',
  'bulk-trading':'Bulk Trading',
  'trade-history':'Trade History',
  settings:      'Settings',
};

interface NavbarProps {
  activePage: NavPage;
  advisorCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  advisorCode = 'ADVISOR201',
}) => {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <h2>{pageTitles[activePage]}</h2>
      </div>

      <div className="navbar__right">
        <div className="navbar__search">
          <Search size={14} />
          <input placeholder="Search..." />
        </div>

        <button className="navbar__icon-btn">
          <Bell size={16} />
          {/* <span className="badge"></span> */}
        </button>

        <div className="navbar__user">
          <div className="navbar__user-avatar">
            {advisorCode.slice(0, 2)}
          </div>
          <div className="navbar__user-info">
            <strong>{advisorCode}</strong>
            <span>Advisor</span>
          </div>
          <ChevronDown size={14} className="navbar__user-caret" />
        </div>
      </div>
    </header>
  );
};