import React from 'react';
import { Plus, Power, RefreshCw } from 'lucide-react';
import { Client } from '../../../types/type';
import { ClientCard } from '../ClientCard/ClientCard';
import './ClientsTab.scss';

interface ClientsTabProps {
  clients: Client[];
  loading: boolean;
  onRefresh: () => void;
  onAuthClient: (clientCode: string) => void;
  onAuthAll: () => void;
  onDelete: (clientCode: string) => void;
  onAddClient: () => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ clients, loading, onRefresh, onAuthClient, onAuthAll, onDelete, onAddClient }) =>
  
  (
  <div className="clients-tab">
    <div className="clients-tab__actions">
      <button className="btn btn--primary" onClick={onAddClient}>
        <Plus size={18} />
        <span>Add Client</span>
      </button>
      <button className="btn btn--success" onClick={onAuthAll} disabled={loading}>
        <Power size={18} />
        <span>Authenticate All</span>
      </button>
      <button className="btn btn--secondary" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={18} className={loading ? 'spin' : ''} />
        <span>Refresh</span>
      </button>
    </div>

    <div className="clients-tab__grid">
      {clients.length === 0 ? (
        <div className="clients-tab__empty">
          <p>No clients found. Add a client to get started.</p>
        </div>
      ) : (
        clients.map((client) => (
          <ClientCard   key={client.client_code} client={client}  onAuth={() => onAuthClient(client.client_code)}  onDelete={() => onDelete(client.client_code)}/>
        ))
      )}
    </div>
  </div>
);