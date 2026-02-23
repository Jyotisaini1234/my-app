import React from 'react';
import { Power, Trash2, Shield, Star } from 'lucide-react';
import './ClientCard.scss';
import { Client } from '../../../types/type';
import { IconButton } from '../../common/IconButton/IconButton';

interface ClientCardProps {
  client: Client;
  onAuth: () => void;
  onDelete: () => void;
}

const StatusBadge: React.FC<{ color: 'success' | 'warning' | 'error' | 'info'; children: React.ReactNode }> = ({ color, children }) => (
  <span className={`status-badge status-badge--${color}`}>{children}</span>
);

export const ClientCard: React.FC<ClientCardProps> = ({ client, onAuth, onDelete }) => {
  return (
    <div
      className={[
        'client-card',
        client.is_master ? 'client-card--master' : '',
        client.is_authenticated ? 'client-card--authenticated' : '',
        !client.is_active ? 'client-card--inactive' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="client-card__header">
        <div className="client-card__title">
          <div className="client-card__code-row">
            {client.is_master && <Star size={12} className="client-card__star" />}
            <h3>{client.client_code}</h3>
          </div>
          <div className="client-card__badges">
            {client.is_master && (
              <StatusBadge color="warning">Master</StatusBadge>
            )}
            {client.is_authenticated && (
              <StatusBadge color="success">Authenticated</StatusBadge>
            )}
            {!client.is_active && (
              <StatusBadge color="error">Inactive</StatusBadge>
            )}
            {client.is_active && !client.is_authenticated && (
              <StatusBadge color="info">Active</StatusBadge>
            )}
          </div>
        </div>

        <div className="client-card__actions">
          <IconButton icon={<Power size={14} />} onClick={onAuth}  title="Authenticate" />
          <IconButton icon={<Trash2 size={14} />} onClick={onDelete} title="Delete" variant="danger"/>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="client-card__details">
        <div className="detail-row">
          <span className="detail-row__label">User ID</span>
          <span className="detail-row__value">{client.user_id || '—'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">2FA</span>
          <span className="detail-row__value">{client.two_fa || '—'}</span>
        </div>
        {client.is_master && (
          <div className="detail-row">
            <span className="detail-row__label">Role</span>
            <span className="detail-row__value">MASTER</span>
          </div>
        )}
      </div>

      {/* ── TOTP ── */}
      {client.totp_info && (
        <div className="client-card__totp">
          <div className="totp__left">
            <Shield size={14} className="totp__icon" />
            <span className="totp__label">TOTP</span>
          </div>
          <div className="totp__code">{client.totp_info.current_totp}</div>
          <div className="totp__expiry">
            Expires in {client.totp_info.expires_in_seconds}s
          </div>
        </div>
      )}
    </div>
  );
};