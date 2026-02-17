import React from 'react';
import { Badge, Power, Trash2, User } from 'lucide-react';
import './ClientCard.scss';
import { Client } from '../../../types/type';
import { IconButton } from '../../common/IconButton/IconButton';

interface ClientCardProps {
  client: Client;
  onAuth: () => void;
  onDelete: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onAuth, onDelete }) => {
  return (
    <div
      className={[
        'client-card',
        client.is_master ? 'client-card--master' : '',
        client.is_authenticated ? 'client-card--authenticated' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="client-card__header">
        <div className="client-card__title">
          <h3>{client.client_code}</h3>
          <div className="client-card__badges">
            {client.is_master && <Badge color="warning">Master</Badge>}
            {client.is_authenticated && <Badge color="success">Authenticated</Badge>}
            {!client.is_active && <Badge color="error">Inactive</Badge>}
            {client.is_active && !client.is_authenticated && (
              <Badge color="info">Active</Badge>
            )}
          </div>
        </div>

        <div className="client-card__actions">
          <IconButton icon={<Power size={14} />} onClick={onAuth} title="Authenticate" />
          <IconButton
            icon={<Trash2 size={14} />}
            onClick={onDelete}
            title="Delete"
            variant="danger"
          />
        </div>
      </div>

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

      {client.totp_info && (
        <div className="client-card__totp">
          <div className="totp__code">{client.totp_info.current_totp}</div>
          <div className="totp__expiry">
            <User size={10} style={{ marginRight: 4 }} />
            Expires in {client.totp_info.expires_in_seconds}s
          </div>
        </div>
      )}
    </div>
  );
};