
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

export const ClientCard: React.FC<ClientCardProps> = ({ client, onAuth, onDelete }) => (
  <div style={{
    background: '#1e293b',
    border: `2px solid ${client.is_authenticated ? '#10b981' : '#334155'}`,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    transition: 'all 0.2s'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{client.client_code}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {client.is_master && <Badge color="#f59e0b">Master</Badge>}
          {client.is_authenticated && <Badge color="#10b981">Authenticated</Badge>}
          {!client.is_active && <Badge color="#ef4444">Inactive</Badge>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <IconButton icon={<Power size={16} />} onClick={onAuth} title="Authenticate" />
        <IconButton icon={<Trash2 size={16} />} onClick={onDelete} title="Delete" />
      </div>
    </div>

    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong>User ID:</strong> {client.user_id}
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong>2FA:</strong> {client.two_fa}
      </div>
      {client.totp_info && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0f172a', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: '#10b981' }}>
            {client.totp_info.current_totp}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Expires in {client.totp_info.expires_in_seconds}s
          </div>
        </div>
      )}
    </div>
  </div>
);