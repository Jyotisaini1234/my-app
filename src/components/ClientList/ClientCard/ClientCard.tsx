import React from 'react';
import { Power, Trash2 } from 'lucide-react';
import { Badge } from '../../common/Badge/Badge';
import { IconButton } from '../../common/IconButton/IconButton';
import { Client } from '../../../types/type';
import './ClientCard.scss';

interface ClientCardProps {
  client: Client;
  onAuth: () => void;
  onDelete: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onAuth,  onDelete }) => {
  return (
    <div className={`client-card ${client.is_master ? 'client-card--master' : ''} ${client.is_authenticated ? 'client-card--authenticated' : ''}`}>
      <div className="client-card__header">
        <div className="client-card__title">
          <h3>{client.client_code}</h3>
          <div className="client-card__badges">
            {client.is_master && (
              <Badge color="warning">Master</Badge>
            )}
            {client.is_authenticated && (
              <Badge color="success">Authenticated</Badge>
            )}
            {!client.is_active && (
              <Badge color="error">Inactive</Badge>
            )}
          </div>
        </div>

        <div className="client-card__actions">
          <IconButton  icon={<Power size={16} />}  onClick={onAuth}  title="Authenticate"  />
          <IconButton  icon={<Trash2 size={16} />}   onClick={onDelete}   title="Delete" />
        </div>
      </div>

      <div className="client-card__details">
        <div className="detail-row">
          <span className="detail-row__label">User ID:</span>
          <span className="detail-row__value">{client.user_id}</span>
        </div>

        <div className="detail-row">
          <span className="detail-row__label">2FA:</span>
          <span className="detail-row__value">{client.two_fa}</span>
        </div>

        {client.totp_info && (
          <div className="client-card__totp">
            <div className="totp__code">{client.totp_info.current_totp}</div>
            <div className="totp__expiry">
              Expires in {client.totp_info.expires_in_seconds}s
            </div>
          </div>
        )}
      </div>
    </div>
  );
};