import React, { useState, useEffect } from 'react';
import { RefreshCw, Power, Plus, Search, Users, Filter } from 'lucide-react';
import './ClientsList.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {fetchClients,authenticateAllClients,authenticateClient,} from '../../../store/slice/clientsSlice/clientsSlice';
import { Spinner } from '../../common/Spinner/Spinner';
import { AddClientModal } from '../AddClientModal.tsx/AddClientModal';
import { Button } from '../../common/Button/Button';

export const ClientsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: clients, loading, authenticatingAll, isFetched } = useAppSelector((s) => s.clients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isFetched) {
      dispatch(fetchClients());
    }
  }, []); 

  const clientsList = Object.values(clients).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.client_code?.toLowerCase().includes(q) ||
      c.client_name?.toLowerCase().includes(q) ||
      c.user_id?.toLowerCase().includes(q)
    );
  });

  const formatCurrency = (val?: number | null) => {
    if (val == null) return '—';
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const getStatusClass = (status?: string) => {
    if (!status) return '';
    if (status === 'Active') return 'status--active';
    if (status === 'Pending KYC') return 'status--pending';
    return 'status--inactive';
  };

  return (
    <div className="clients-list">

      <div className="clients-list__topbar">
        <div className="clients-list__search-wrap">
          <Search size={14} />
          <input
            placeholder="Search Clients"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>
          Add client
        </Button>
      </div>

      <div className="clients-list__subtoolbar">
        <div className="clients-list__subtoolbar-left">
          <button className="subtoolbar__nav-btn">‹</button>
          <span className="subtoolbar__hint">Search 10000 Client for keywords</span>
        </div>
        <div className="clients-list__subtoolbar-right">
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} className={loading ? 'spin' : ''} />} onClick={() => dispatch(fetchClients())}disabled={loading} >
            Refresh
          </Button>
          <Button variant="success" size="sm" icon={<Power size={14} />} loading={authenticatingAll}onClick={() => dispatch(authenticateAllClients())} >
            Auth All
          </Button>
          <button className="subtoolbar__filter-btn"><Filter size={14} /></button>
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading clients…" />
      ) : clientsList.length === 0 ? (
        <div className="clients-list__empty">
          <Users size={48} />
          <h3>{search ? 'No clients found' : 'No clients yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Add your first client to get started.'}</p>
        </div>
      ) : (
        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Broker</th>
                <th>Client Name</th>
                <th>Account Status</th>
                <th>Invested Amount</th>
              </tr>
            </thead>
            <tbody>
              {clientsList.map((client) => (
                <tr key={client.client_code}>
                  {/* Client ID */}
                  <td>
                    <div className="client-id-cell">
                      <span className={`client-id-cell__dot ${client.is_master ? 'dot--master' : 'dot--sub'}`} />
                      <div className="client-id-cell__info">
                        <strong>{client.client_code}</strong>
                      </div>
                    </div>
                  </td>

                  {/* Broker */}
                  <td>
                    <span className="broker-badge">
                      <span className="broker-badge__dot" />
                      {client.broker || 'Motilal Oswal'}
                    </span>
                  </td>

                  {/* Client Name */}
                  <td>
                    <span className="amount-cell">
                      <strong>{client.client_name || client.user_id || '—'}</strong>
                    </span>
                  </td>

                  {/* Account Status */}
                  <td>
                    <span className={`status-badge ${getStatusClass(client.account_status)}`}>
                      {client.account_status || '—'}
                    </span>
                  </td>

                  {/* Current Value */}
                  <td>
                    <span className="amount-cell">
                      {formatCurrency(client.current_value)}
                    </span>
                    {client.profit_loss != null && client.profit_loss !== 0 && (
                      <span className={`pnl-badge ${client.profit_loss >= 0 ? 'pnl-badge--up' : 'pnl-badge--down'}`}>
                        {client.profit_loss >= 0 ? '+' : ''}{formatCurrency(client.profit_loss)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && clientsList.length > 0 && (
        <div className="clients-list__pagination">
          <button className="pg-btn pg-btn--prev">‹</button>
          <button className="pg-btn pg-btn--first">«</button>
          <button className="pg-btn pg-btn--active">1</button>
          <button className="pg-btn pg-btn--last">»</button>
          <button className="pg-btn pg-btn--next">›</button>
        </div>
      )}

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};