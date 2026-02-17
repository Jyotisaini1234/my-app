import React, { useState, useEffect } from 'react';
import { RefreshCw, Power, Plus, Search, Users } from 'lucide-react';

import './ClientsList.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClients, authenticateAllClients, authenticateClient, deleteClient } from '../../../store/slice/clientsSlice/clientsSlice';
import { Spinner } from '../../common/Spinner/Spinner';
import { AddClientModal } from '../AddClientModal.tsx/AddClientModal';
import { ClientCard } from '../ClientCard/ClientCard';
import { Button } from '../../common/Button/Button';

export const ClientsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: clients, loading, authenticatingAll } = useAppSelector((s) => s.clients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const clientsList = Object.values(clients).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.client_code.toLowerCase().includes(q) ||
      c.user_id?.toLowerCase().includes(q)
    );
  });

  const total = Object.keys(clients).length;
  const authenticated = Object.values(clients).filter((c) => c.is_authenticated).length;
  const masters = Object.values(clients).filter((c) => c.is_master).length;
  const active = Object.values(clients).filter((c) => c.is_active).length;

  return (
    <div className="clients-list">
      {/* Stats */}
      <div className="client-stats">
        <div className="client-stats__item">
          <span className="client-stats__item-label">Total Clients</span>
          <span className="client-stats__item-value">{total}</span>
        </div>
        <div className="client-stats__item client-stats__item--success">
          <span className="client-stats__item-label">Authenticated</span>
          <span className="client-stats__item-value">{authenticated}</span>
        </div>
        <div className="client-stats__item client-stats__item--info">
          <span className="client-stats__item-label">Active</span>
          <span className="client-stats__item-value">{active}</span>
        </div>
        <div className="client-stats__item client-stats__item--warning">
          <span className="client-stats__item-label">Masters</span>
          <span className="client-stats__item-value">{masters}</span>
        </div>
      </div>

      {/* Header */}
      <div className="clients-list__header">
        <div className="clients-list__meta">
          <h2>Client List</h2>
          <span>{clientsList.length} of {total} clients</span>
        </div>

        <div className="clients-list__actions">
          <div className="clients-list__search">
            <Search size={14} />
            <input
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setShowAddModal(true)}
          >
            Add Client
          </Button>

          <Button
            variant="success"
            size="sm"
            icon={<Power size={15} />}
            loading={authenticatingAll}
            onClick={() => dispatch(authenticateAllClients())}
          >
            Auth All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={15} className={loading ? 'spin' : ''} />}
            onClick={() => dispatch(fetchClients())}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Spinner text="Loading clients…" />
      ) : clientsList.length === 0 ? (
        <div className="clients-list__empty">
          <Users size={48} />
          <h3>{search ? 'No clients found' : 'No clients yet'}</h3>
          <p>
            {search ? 'Try a different search term.' : 'Add your first client to get started.'}
          </p>
        </div>
      ) : (
        <div className="clients-list__grid">
          {clientsList.map((client) => (
            <ClientCard
              key={client.client_code}
              client={client}
              onAuth={() => dispatch(authenticateClient(client.client_code))}
              onDelete={() => {
                if (window.confirm(`Delete client ${client.client_code}?`)) {
                  dispatch(deleteClient(client.client_code));
                }
              }}
            />
          ))}
        </div>
      )}

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};