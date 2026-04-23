import React from 'react';
import { LogOut, Wifi, Clock, Shield } from 'lucide-react';
import './SettingsPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutThunk } from '../../store/slice/authSlice/authSlice';

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  return (
    <div className="settings-page">

      {/* ── Account ── */}
      <div className="settings-section">
        <h3>Account</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__avatar">
              {(user?.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="settings-row__info">
              <strong>{user?.name || '—'}</strong>
              <span>{user?.email || '—'}</span>
            </div>
            <span className="settings-status settings-status--active">
              {user?.role || 'Advisor'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Broker ── */}
      <div className="settings-section">
        <h3>Broker Configuration</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__icon settings-row__icon--green">
              <Wifi size={16} />
            </div>
            <div className="settings-row__info">
              <strong>Motilal Oswal</strong>
              <span>Primary broker — API v2</span>
            </div>
            <span className="settings-status settings-status--active">Connected</span>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__icon settings-row__icon--green">
              <Wifi size={16} />
            </div>
            <div className="settings-row__info">
              <strong>Shoonya</strong>
            </div>
            <span className="settings-status settings-status--active">Connected</span>
          </div>
        </div>
      </div>

      {/* ── Coming Soon ── */}
      <div className="settings-section">
        <h3>Coming Soon</h3>
        <div className="settings-card settings-card--muted">
          <div className="broker-list">
            {['Zerodha', 'ICICI Direct'].map(name => (
              <div key={name} className="broker-item">
                <div className="broker-item__left">
                  <Clock size={14} className="broker-item__icon" />
                  <span className="broker-item__name">{name}</span>
                </div>
                <span className="broker-item__badge">Planned</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="settings-section">
        <div className="settings-card settings-card--danger">
          <div className="settings-row">
            <div className="settings-row__icon settings-row__icon--red">
              <Shield size={16} />
            </div>
            <div className="settings-row__info">
              <strong>Sign Out</strong>
              <span>End your current session</span>
            </div>
            <button className="settings-logout-btn" onClick={handleLogout}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};