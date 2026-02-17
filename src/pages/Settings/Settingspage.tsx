import React from 'react';
import './SettingsPage.scss';

export const SettingsPage: React.FC = () => {
  return (
    <div className="settings-page">
      <div className="settings-section">
        <h3>Broker Configuration</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <strong>Motilal Oswal</strong>
              <p>Primary broker — API v2</p>
            </div>
            <span className="settings-status settings-status--active">Connected</span>
          </div>
          <div className="settings-row settings-row--info">
            <span className="settings-label">API Base URL</span>
            <code>https://apiconnect.angelone.in</code>
          </div>
          <div className="settings-row settings-row--info">
            <span className="settings-label">Trade Base URL</span>
            <code>Internal Trade Service</code>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Coming Soon</h3>
        <div className="settings-card settings-card--muted">
          <div className="broker-list">
            <div className="broker-item">
              <span className="broker-item__name">Shoonya</span>
              <span className="broker-item__badge">Planned</span>
            </div>
            <div className="broker-item">
              <span className="broker-item__name">Zerodha</span>
              <span className="broker-item__badge">Planned</span>
            </div>
            <div className="broker-item">
              <span className="broker-item__name">ICICI Direct</span>
              <span className="broker-item__badge">Planned</span>
            </div>
            <div className="broker-item">
              <span className="broker-item__name">Angel One</span>
              <span className="broker-item__badge">Planned</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};