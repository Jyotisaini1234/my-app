import React from 'react';
import { Plus, Power, RefreshCw } from 'lucide-react';
import { Client } from '../../../types/type';
import { Button } from '../../common/Button/Button';
import { ClientCard } from '../ClientCard/ClientCard';


interface ClientsTabProps {
  clients: Client[];
  loading: boolean;
  onRefresh: () => void;
  onAuthClient: (clientCode: string) => void;
  onAuthAll: () => void;
  onDelete: (clientCode: string) => void;
  onAddClient: () => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ clients, loading, onRefresh, onAuthClient, onAuthAll, onDelete, onAddClient }) => (
  <div>
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
      <Button icon={<Plus size={18} />} onClick={onAddClient}>Add Client</Button>
      <Button icon={<Power size={18} />} onClick={onAuthAll} variant="success">Authenticate All</Button>
      <Button icon={<RefreshCw size={18} />} onClick={onRefresh} disabled={loading}>Refresh</Button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
      {clients.map((client) => (
        <ClientCard 
          key={client.client_code} 
          client={client}
          onAuth={() => onAuthClient(client.client_code)}
          onDelete={() => onDelete(client.client_code)}
        />
      ))}
    </div>
  </div>
);