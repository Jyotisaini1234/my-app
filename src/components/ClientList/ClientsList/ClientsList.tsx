import React, { useState } from 'react';
import { RefreshCw, Power, Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import './ClientsList.scss';
import { fetchClients, authenticateAllClients } from '../../../store/slice/clientsSlice/clientsSlice';
import { AddClientModal } from '../AddClientModal.tsx/AddClientModal';
import { ClientCard } from '../ClientCard/ClientCard';

export const ClientsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: clients, loading } = useAppSelector(state => state.clients);
  const [showAddModal, setShowAddModal] = useState(false);
  const clientsList = Object.values(clients);

  const handleRefresh = () => {
    dispatch(fetchClients());
  };

  const handleAuthenticateAll = () => {
    dispatch(authenticateAllClients());
  };

  return (
    <div className="clients-list">
      <div className="clients-list__header">
        <div className="clients-list__actions">
          <button  className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add Client
          </button>
          <button  className="btn btn--success"  onClick={handleAuthenticateAll}disabled={loading} >
            <Power size={18} /> Authenticate All
          </button>
          <button  className="btn btn--secondary"  onClick={handleRefresh} disabled={loading} >
            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="clients-list__grid">
        {clientsList.map(client => (
          <ClientCard key={client.client_code} client={client} onAuth={function (): void {
            throw new Error('Function not implemented.');
          } } onDelete={function (): void {
            throw new Error('Function not implemented.');
          } } />
        ))}
      </div>

      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} onSuccess={function (): void {
          throw new Error('Function not implemented.');
        } } />
      )}
    </div>
  );
};