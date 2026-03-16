import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, User, Mail, Phone, Hash, ShieldCheck, ShieldOff, X } from 'lucide-react';
import { NavPage } from '../../../types/type';
import { useAppSelector } from '../../../store/hooks';
import './Navbar.scss';

const pageTitles: Record<NavPage, string> = {
  dashboard: 'Dashboard',
  clients: 'Client Management',
  'bulk-trading': 'Bulk Trading',
  'trade-history': 'Trade History',
  settings: 'Settings',
  'order-logs': 'Order Logs',
  'log-export': 'Log Export',
  portfolio: 'Portfolio'
};

interface NavbarProps {
  activePage: NavPage;
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onMenuToggle }) => {
  const user = useAppSelector((s) => s.auth.user);

  const name       = user?.name       || '—';
  const clientCode = (user as any)?.clientCode || user?.id || '—';
  const email      = user?.email      || '—';
  const phone      = user?.phone      || '—';
  const role       = user?.role       || '—';
  const isMaster   = user?.role === 'MASTER';

  // Initials from real name, fallback to clientCode
  const initials = name !== '—' && name !== clientCode
    ? name.slice(0, 2).toUpperCase()
    : clientCode.slice(0, 2).toUpperCase();

  const [open, setOpen]  = useState(false);
  const dropdownRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const rows = [
    { icon: <User  size={13} />, label: 'Name',        value: name        },
    { icon: <Hash  size={13} />, label: 'Client Code', value: clientCode  },
    { icon: <Mail  size={13} />, label: 'Email',        value: email       },
    { icon: <Phone size={13} />, label: 'Mobile',       value: phone       },
  ];

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <h2 className="navbar__title">{pageTitles[activePage]}</h2>
      </div>

      <div className="navbar__right">
        <div className="navbar__user-wrap" ref={dropdownRef}>

          {/* Trigger — shows clientCode in navbar (short) */}
          <div className="navbar__user" onClick={() => setOpen((p) => !p)}>
            <div className="navbar__user-avatar">{initials}</div>
            <div className="navbar__user-info">
              <strong>{clientCode}</strong>
              <span>{role}</span>
            </div>
            <ChevronDown
              size={14}
              className={`navbar__user-caret ${open ? 'navbar__user-caret--open' : ''}`}
            />
          </div>

          {/* Dropdown */}
          {open && (
            <div className="profile-dropdown">

              <div className="profile-dropdown__header">
                <div className="profile-dropdown__avatar">{initials}</div>
                <div className="profile-dropdown__header-info">
                  {/* Show real name in header if available, else clientCode */}
                  <span className="profile-dropdown__header-name">
                    {name !== '—' && name !== clientCode ? name : clientCode}
                  </span>
                  <span className={`profile-dropdown__badge ${isMaster ? 'profile-dropdown__badge--master' : 'profile-dropdown__badge--user'}`}>
                    {isMaster ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                    {isMaster ? 'Master' : 'User'}
                  </span>
                </div>
                <button className="profile-dropdown__close" onClick={() => setOpen(false)}>
                  <X size={14} />
                </button>
              </div>

              <div className="profile-dropdown__divider" />

              <div className="profile-dropdown__body">
                {rows.map((row) => (
                  <div key={row.label} className="profile-dropdown__row">
                    <div className="profile-dropdown__row-icon">{row.icon}</div>
                    <div className="profile-dropdown__row-content">
                      <span className="profile-dropdown__row-label">{row.label}</span>
                      <span className="profile-dropdown__row-value">{row.value}</span>
                    </div>
                  </div>
                ))}

                {/* Master Account */}
                <div className="profile-dropdown__row">
                  <div className="profile-dropdown__row-icon">
                    {isMaster ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                  </div>
                  <div className="profile-dropdown__row-content">
                    <span className="profile-dropdown__row-label">Master Account</span>
                    <span className={`profile-dropdown__bool ${isMaster ? 'profile-dropdown__bool--true' : 'profile-dropdown__bool--false'}`}>
                      {isMaster ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};