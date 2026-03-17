import React, { useState, useEffect } from 'react';
import RefreshIcon            from '@mui/icons-material/Refresh';
import PowerSettingsNewIcon   from '@mui/icons-material/PowerSettingsNew';
import ExpandMoreIcon         from '@mui/icons-material/ExpandMore';
import ChevronRightIcon       from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon      from '@mui/icons-material/DeleteOutline';
import PersonAddAltIcon       from '@mui/icons-material/PersonAddAlt';
import AddIcon                from '@mui/icons-material/Add';
import VerifiedUserIcon       from '@mui/icons-material/VerifiedUser';
import ErrorOutlineIcon       from '@mui/icons-material/ErrorOutline';
import ShowChartIcon          from '@mui/icons-material/ShowChart';
import HistoryIcon            from '@mui/icons-material/History';
import AlternateEmailIcon     from '@mui/icons-material/AlternateEmail';
import PhoneAndroidIcon       from '@mui/icons-material/PhoneAndroid';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TagIcon                from '@mui/icons-material/Tag';
import FiberManualRecordIcon  from '@mui/icons-material/FiberManualRecord';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import TrendingDownIcon       from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon     from '@mui/icons-material/AccountBalance';
import WarningAmberIcon       from '@mui/icons-material/WarningAmber';

import './ClientsList.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClients, authenticateAllClients } from '../../../store/slice/clientsSlice/clientsSlice';
import { setSelectedClients } from '../../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { Spinner } from '../../common/Spinner/Spinner';
import { NavPage } from '../../../types/type';
import { useFetchGroupsQuery, useDeleteGroupMutation, GroupEntry } from '../../../store/slice/groupsSlice/groupsSlice';
import { AddClientModal }   from '../AddClientModal.tsx/AddClientModal';
import { AddToGroupModal }  from '../AddToGroupModal/AddToGroupModal';
import { CreateGroupModal } from '../CreateGroupModal/CreateGroupModal';
import { useToast }         from '../../../context/Toastcontext';
import { UserPortal } from '../Userportal/Userportal';

interface ClientsListProps { onNavigate: (page: NavPage) => void; }


export const ClientsList: React.FC<ClientsListProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { data: clients, loading, authenticatingAll, isFetched } = useAppSelector(s => s.clients);
  const { user } = useAppSelector(s => s.auth);
  const isMaster = user?.role === 'MASTER';
  const { data: groups = {}, isLoading: groupsLoading, refetch: refetchGroups } = useFetchGroupsQuery();
  const [deleteGroup] = useDeleteGroupMutation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [addToGroup, setAddToGroup] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [confirmDeleteGroup,setConfirmDeleteGroup]   = useState<string | null>(null);
  useEffect(() => { if (!isFetched) dispatch(fetchClients()); }, [isFetched, dispatch]);
  const clientsList    = Object.values(clients);
  const allClientCodes = clientsList.map(c => c.client_code);
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

  if (!isMaster) {
  return (
    <UserPortal client={clientsList[0]} loading={loading} onNavigate={onNavigate} onRefresh={handleRefresh}/>
  );
}

const selectedCodes = getSelectedClientCodes();

  return (
    <div className="cm">
      <div className="cm__header"><h2 className="cm__title">Client Groups</h2></div>

      <div className="cm__bar">
        <button className="cm__btn cm__btn--ghost" onClick={handleAuthAll} disabled={authenticatingAll}>
          <PowerSettingsNewIcon />{authenticatingAll ? 'Authenticating…' : 'Auth All'}
        </button>
        <button className="cm__btn cm__btn--ghost" onClick={handleRefresh} disabled={loading || groupsLoading}>
          <RefreshIcon className={(loading || groupsLoading) ? 'spin' : ''} />Refresh
        </button>
        <button className="cm__btn cm__btn--soft" onClick={() => setShowAddModal(true)}>
          <AddIcon />Add Client
        </button>
        <button className="cm__btn cm__btn--primary" onClick={() => setShowCreateGroupModal(true)}>
          <AddIcon />New Group
        </button>
      </div>

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
                          <tr><th>Code</th><th>Email</th><th>Status</th><th>Auth</th></tr>
                        </thead>
                        <tbody>
                          {!grpClients.length
                            ? <tr><td colSpan={4} className="cm__empty-row">No clients</td></tr>
                            : grpClients.map(([code, d]) => (
                                <tr key={code}>
                                  <td><span className="cm__mono">{code}</span></td>
                                  <td>{d.email ?? '—'}</td>
                                  <td>
                                    <span className={`cm__dot cm__dot--${d.is_active ? 'on' : 'off'}`}>
                                      {d.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`cm__dot cm__dot--${d.is_authenticated ? 'on' : 'off'}`}>
                                      {d.is_authenticated ? 'Auth' : 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                          }
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })
        }
      </div>

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