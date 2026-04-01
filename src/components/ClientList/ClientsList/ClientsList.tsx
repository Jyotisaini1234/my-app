import React, { useState, useEffect } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import AddIcon from '@mui/icons-material/Add';
import './ClientsList.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClients, authenticateAllClients } from '../../../store/slice/clientsSlice/clientsSlice';
import { setSelectedClients } from '../../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { Spinner } from '../../common/Spinner/Spinner';
import { GroupEntry, NavPage } from '../../../types/type';
import { useFetchGroupsQuery, useDeleteGroupMutation } from '../../../store/slice/groupsSlice/groupsSlice';
import { AddClientModal }    from '../AddClientModal.tsx/AddClientModal';
import { AddToGroupModal }   from '../AddToGroupModal/AddToGroupModal';
import { CreateGroupModal }  from '../CreateGroupModal/CreateGroupModal';
import { useToast }          from '../../../context/ToastContext/Toastcontext';
import { UserPortal }        from '../Userportal/Userportal';
import { UserInfo }          from '../../../types/profile';

interface ClientsListProps { onNavigate: (page: NavPage) => void; }

const getEnabledBrokers = (client: any): string[] => {
  const brokers = client?.brokers ?? {};
  return Object.keys(brokers).filter(b => brokers[b]?.enabled !== false);
};

export const ClientsList: React.FC<ClientsListProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { data: clients, loading, authenticatingAll, isFetched } = useAppSelector(s => s.clients);
  const { user } = useAppSelector(s => s.auth);
  const isMaster = user?.role === 'MASTER';
  const { data: groups = {}, isLoading: groupsLoading, refetch: refetchGroups } = useFetchGroupsQuery();
  const [deleteGroup] = useDeleteGroupMutation();

  const [showAddModal,        setShowAddModal]        = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [addToGroup,          setAddToGroup]          = useState<string | null>(null);
  const [expandedGroups,      setExpandedGroups]      = useState<Set<string>>(new Set());
  const [selectedGroups,      setSelectedGroups]      = useState<Set<string>>(new Set());
  const [confirmDeleteGroup,  setConfirmDeleteGroup]  = useState<string | null>(null);

  const [addBrokerTarget, setAddBrokerTarget] = useState<{
    clientCode: string;
    clientName?: string;
    existingBrokers: string[];
  } | null>(null);

  useEffect(() => { if (!isFetched) dispatch(fetchClients()); }, [isFetched, dispatch]);

  const clientsList    = Object.values(clients) as any[];
  const allClientCodes = clientsList.map((c: any) => c.client_code);

  const toggle = (set: Set<string>, val: string) => {
    const n = new Set(set); n.has(val) ? n.delete(val) : n.add(val); return n;
  };

  const getSelectedClientCodes = (): string[] => {
    const codes = new Set<string>();
    selectedGroups.forEach(g => Object.keys(groups[g]?.clients ?? {}).forEach(c => codes.add(c)));
    return Array.from(codes);
  };

  const handleProceed = () => {
    const codes = getSelectedClientCodes();
    if (!codes.length) return;
    dispatch(setSelectedClients(codes));
    onNavigate('bulk-trading');
  };

  const confirmDelete = async () => {
    if (!confirmDeleteGroup) return;
    try {
      await deleteGroup(confirmDeleteGroup).unwrap();
      setSelectedGroups(prev => { const n = new Set(prev); n.delete(confirmDeleteGroup); return n; });
      showToast(`Group "${confirmDeleteGroup}" deleted`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete group', 'error');
    } finally { setConfirmDeleteGroup(null); }
  };

  const handleAuthAll = async () => {
    const r = await dispatch(authenticateAllClients());
    authenticateAllClients.fulfilled.match(r)
      ? showToast('All clients authenticated', 'success')
      : showToast((r.payload as string) || 'Authentication failed', 'error');
  };

  const handleRefresh = () => { dispatch(fetchClients()); refetchGroups(); };

  // Non-master: show UserPortal only (no Add Client for non-master)
  if (!isMaster) {
    return (
      <UserPortal
        client={clientsList[0]}
        user={user as unknown as UserInfo | undefined}
        loading={loading}
        onNavigate={onNavigate}
        onRefresh={handleRefresh}
      />
    );
  }

  const selectedCodes = getSelectedClientCodes();

  return (
    <div className="cm">
      <div className="cm__header"><h2 className="cm__title">Client Groups</h2></div>

      {/* ── Toolbar ── */}
      <div className="cm__bar">
        <button className="cm__btn cm__btn--ghost" onClick={handleAuthAll} disabled={authenticatingAll}>
          <PowerSettingsNewIcon />{authenticatingAll ? 'Authenticating…' : 'Auth All'}
        </button>
        <button className="cm__btn cm__btn--ghost" onClick={handleRefresh} disabled={loading || groupsLoading}>
          <RefreshIcon className={(loading || groupsLoading) ? 'spin' : ''} />Refresh
        </button>

        {/* ✅ Add Client — sirf master ko */}
        <button className="cm__btn cm__btn--soft" onClick={() => setShowAddModal(true)}>
          <AddIcon />Add Client
        </button>

        <button className="cm__btn cm__btn--primary" onClick={() => setShowCreateGroupModal(true)}>
          <AddIcon />New Group
        </button>
      </div>

      {/* ── Groups ── */}
      <div className="cm__groups">
        {groupsLoading
          ? <Spinner text="Loading groups…" />
          : !Object.keys(groups).length
            ? <div className="cm__empty"><p>No groups yet. Create your first group.</p></div>
            : Object.entries(groups).map(([name, entry]: [string, GroupEntry]) => {
                const expanded   = expandedGroups.has(name);
                const checked    = selectedGroups.has(name);
                const grpClients = Object.entries(entry.clients ?? {});
                return (
                  <div key={name} className={`cm__card${checked ? ' cm__card--on' : ''}`}>
                    <div className="cm__card-head">
                      <input type="checkbox" checked={checked}
                        onChange={() => setSelectedGroups(prev => toggle(prev, name))} />
                      <span className="cm__chevron"
                        onClick={() => setExpandedGroups(prev => toggle(prev, name))}>
                        {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                      </span>
                      <span className="cm__gname"
                        onClick={() => setExpandedGroups(prev => toggle(prev, name))}>
                        {name}
                      </span>
                      <span className="cm__count">{grpClients.length}</span>
                      <div className="cm__card-actions">
                        <button className="cm__icon-btn" onClick={() => setAddToGroup(name)}>
                          <PersonAddAltIcon />
                        </button>
                        <button className="cm__icon-btn cm__icon-btn--del"
                          onClick={() => setConfirmDeleteGroup(name)}>
                          <DeleteOutlineIcon />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <table className="cm__table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Brokers</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!grpClients.length
                            ? <tr><td colSpan={5} className="cm__empty-row">No clients</td></tr>
                            : grpClients.map(([code, d]) => {
                               const fullClient = (clients[code] ??clients[code?.toUpperCase()] ??clients[code?.toLowerCase()] ?? Object.values(clients).find((c: any) =>   c.client_code?.toLowerCase() === code?.toLowerCase() )) as any;
                                const existingBrokers = fullClient ? getEnabledBrokers(fullClient) : [];
                                const allBrokers = ['MOTILAL', 'SHOONYA'];
                                const canAddBroker = existingBrokers.length < allBrokers.length;

                                return (
                                  <tr key={code}>
                                    <td><span className="cm__mono">{code}</span></td>
                                    <td>{d.email ?? '—'}</td>
                                    <td>
                                      <span className={`cm__dot cm__dot--${d.is_active ? 'on' : 'off'}`}>
                                        {d.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="cm__broker-cell">
                                        {existingBrokers.map(b => (
                                          <span
                                            key={b}
                                            className={`cm__broker-badge cm__broker-badge--${b.toLowerCase()}`}
                                          >
                                            {b.substring(0, 2)}
                                          </span>
                                        ))}
                                        {canAddBroker && (
                                          <button
                                            className="cm__add-broker-btn"
                                            title="Add broker to this client"
                                            onClick={() => setAddBrokerTarget({
                                              clientCode:      code,
                                              clientName:      fullClient?.client_name ?? fullClient?.name,
                                              existingBrokers,
                                            })}
                                          >
                                            <AddIcon style={{ fontSize: 13 }} />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                          }
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })
        }
      </div>

      {/* ── Footer ── */}
      {!!Object.keys(groups).length && (
        <div className="cm__footer">
          <span className="cm__hint">
            {selectedGroups.size
              ? `${selectedGroups.size} group · ${selectedCodes.length} clients`
              : 'Select groups to proceed'}
          </span>
          <button className="cm__btn cm__btn--proceed"
            disabled={!selectedGroups.size} onClick={handleProceed}>
            Proceed ({selectedCodes.length})
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal &&
        <AddClientModal onClose={() => setShowAddModal(false)} />}
      {showCreateGroupModal &&
        <CreateGroupModal allClientCodes={allClientCodes} masterCode={user?.id ?? ''}
          onClose={() => setShowCreateGroupModal(false)} />}
      {addToGroup &&
        <AddToGroupModal groupName={addToGroup}
          existingCodes={Object.keys(groups[addToGroup]?.clients ?? {})}
          allClientCodes={allClientCodes} onClose={() => setAddToGroup(null)} />}

      {confirmDeleteGroup && (
        <div className="overlay" onClick={() => setConfirmDeleteGroup(null)}>
          <div className="dlg" onClick={e => e.stopPropagation()}>
            <span className="dlg__icon"><DeleteOutlineIcon /></span>
            <h3>Delete "{confirmDeleteGroup}"?</h3>
            <p>This removes the group. Clients will <strong>not</strong> be deleted.</p>
            <div className="dlg__actions">
              <button className="cm__btn cm__btn--ghost"
                onClick={() => setConfirmDeleteGroup(null)}>Cancel</button>
              <button className="cm__btn cm__btn--danger"
                onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};