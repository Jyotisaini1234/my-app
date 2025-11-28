import React from 'react';
import { Plus, Power, RefreshCw } from 'lucide-react';
import { Client } from '../../../types/type';
import { ClientCard } from '../ClientCard/ClientCard';
import { Button } from '@mui/material';


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
    <Button variant="contained"color="primary" startIcon={<Plus size={18} />}onClick={onAddClient}>Add Client</Button>  
    <Button variant="contained"color="success"startIcon={<Power size={18} />}onClick={onAuthAll}> Authenticate All</Button>
    <Button variant="outlined"startIcon={<RefreshCw size={18} />}onClick={onRefresh}disabled={loading}>Refresh</Button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
      {clients.map((client) => (
        <ClientCard key={client.client_code}   client={client} onAuth={() => onAuthClient(client.client_code)}onDelete={() => onDelete(client.client_code)}/>
      ))}
    </div>
  </div>
);