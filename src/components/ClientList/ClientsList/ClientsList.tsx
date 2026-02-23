import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Power } from 'lucide-react';
import './ClientsList.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClients,authenticateAllClients,} from '../../../store/slice/clientsSlice/clientsSlice';
import { setSelectedClients } from '../../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { Spinner } from '../../common/Spinner/Spinner';
import { AddClientModal } from '../AddClientModal.tsx/AddClientModal';
import { NavPage } from '../../../types/type';

interface ClientsListProps {
  onNavigate: (page: NavPage) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { data: clients, loading, authenticatingAll, isFetched } = useAppSelector(s => s.clients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isFetched) dispatch(fetchClients());
  }, []);

  const clientsList = Object.values(clients);

  const toggleSelect = (code: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleProceed = () => {
    if (selected.size === 0) return;
    dispatch(setSelectedClients(Array.from(selected)));
    onNavigate('bulk-trading');
  };

  return (
    <div className="cm">
      <div className="cm__header">
        <h2 className="cm__title">Client Management</h2>
      </div>

      <div className="cm__actions">
        <button  className="cm__btn cm__btn--outline" onClick={() => dispatch(authenticateAllClients())} disabled={authenticatingAll}>
          <Power size={14} />
          {authenticatingAll ? 'Authenticating…' : 'Auth All'}
        </button>
        <button className="cm__btn cm__btn--outline"  onClick={() => dispatch(fetchClients())} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
        <button className="cm__btn cm__btn--primary" onClick={() => setShowAddModal(true)} >
          <Plus size={15} />
          Add Client
        </button>
      </div>

      {loading ? (
        <Spinner text="Loading clients…" />
      ) : clientsList.length === 0 ? (
        <div className="cm__empty">
          <p>No clients yet. Add your first client to get started.</p>
        </div>
      ) : (
        <div className="cm__table-wrap">
          <table className="cm__table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Broker Account</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientsList.map(client => (
                <tr key={client.client_code} onClick={() => toggleSelect(client.client_code)} className={selected.has(client.client_code) ? 'cm__row--selected' : ''} >
                  <td>
                    <span className="cm__group">
                      {client.client_name || client.user_id || 'Alpha Group'}
                    </span>
                  </td>
                  <td>
                    <span className="cm__broker">{client.client_code}</span>
                  </td>
                  <td>
                    <span className={`cm__status ${client.is_active ? 'cm__status--active' : 'cm__status--inactive'}`}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="cm__checkbox" checked={selected.has(client.client_code)} onChange={() => toggleSelect(client.client_code)}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && clientsList.length > 0 && (
        <div className="cm__footer">
          <button className="cm__btn cm__btn--proceed" disabled={selected.size === 0} onClick={handleProceed}>
            Proceed for next
          </button>
          <button className="cm__btn cm__btn--primary" onClick={() => setShowAddModal(true)} >
            <Plus size={14} />
            Add Client
          </button>
        </div>
      )}

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};