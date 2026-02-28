import React, { useState, useEffect } from 'react';
import { RefreshCw, Power, ChevronDown, ChevronRight, Trash2, UserPlus, Plus } from 'lucide-react';
import './ClientsList.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClients, authenticateAllClients } from '../../../store/slice/clientsSlice/clientsSlice';
import { setSelectedClients } from '../../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { Spinner } from '../../common/Spinner/Spinner';
import { NavPage } from '../../../types/type';
import { useCreateGroupMutation, useFetchGroupsQuery, useDeleteGroupMutation, GroupEntry } from '../../../store/slice/groupsSlice/groupsSlice';
import { UserProfileView } from '../UserProfileView/UserProfileView';
import { AddClientModal } from '../AddClientModal.tsx/AddClientModal';
import { AddToGroupModal } from '../AddToGroupModal/AddToGroupModal';
import { CreateGroupModal } from '../CreateGroupModal/CreateGroupModal';
import { useToast } from '../../../context/Toastcontext';

interface ClientsListProps {
  onNavigate: (page: NavPage) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({ onNavigate }) => {
  const dispatch      = useAppDispatch();
  const { showToast } = useToast();

  const { data: clients, loading, authenticatingAll, isFetched } = useAppSelector(s => s.clients);
  const { user }  = useAppSelector(s => s.auth);
  const isMaster  = user?.role === 'MASTER';

  const { data: groups = {}, isLoading: groupsLoading, refetch: refetchGroups } = useFetchGroupsQuery();
  const [deleteGroup] = useDeleteGroupMutation();

  const [showAddModal,         setShowAddModal]         = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [addToGroup,           setAddToGroup]           = useState<string | null>(null);
  const [expandedGroups,       setExpandedGroups]       = useState<Set<string>>(new Set());
  const [selectedGroups,       setSelectedGroups]       = useState<Set<string>>(new Set());

  // ✅ Confirm-delete modal state (replaces window.confirm)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null);

  // ✅ Sirf tab fetch karo jab data nahi hai
  useEffect(() => {
    if (!isFetched) dispatch(fetchClients());
  }, [isFetched, dispatch]);

  const clientsList    = Object.values(clients);
  const allClientCodes = clientsList.map(c => c.client_code);

  const toggleExpand = (name: string) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const toggleSelectGroup = (name: string) =>
    setSelectedGroups(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const getSelectedClientCodes = (): string[] => {
    const codes = new Set<string>();
    selectedGroups.forEach(groupName => {
      Object.keys(groups[groupName]?.clients ?? {}).forEach(code => codes.add(code));
    });
    return Array.from(codes);
  };

  const handleProceed = () => {
    const codes = getSelectedClientCodes();
    if (codes.length === 0) return;
    dispatch(setSelectedClients(codes));
    onNavigate('bulk-trading');
  };

  // ✅ Delete with toast — no window.confirm
  const handleDeleteGroup = async (groupName: string) => {
    setConfirmDeleteGroup(groupName);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteGroup) return;
    try {
      await deleteGroup(confirmDeleteGroup).unwrap();
      setSelectedGroups(prev => { const n = new Set(prev); n.delete(confirmDeleteGroup); return n; });
      showToast(`Group "${confirmDeleteGroup}" deleted successfully`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete group', 'error');
    } finally {
      setConfirmDeleteGroup(null);
    }
  };

  // ✅ Auth all with toast
  const handleAuthAll = async () => {
    const result = await dispatch(authenticateAllClients());
    if (authenticateAllClients.fulfilled.match(result)) {
      showToast('All clients authenticated successfully', 'success');
    } else {
      showToast((result.payload as string) || 'Authentication failed', 'error');
    }
  };

  const handleRefresh = () => {
    dispatch(fetchClients());
    refetchGroups();
  };

  // ── Non-master view ───────────────────────────────────────────────────────
  if (!isMaster) {
    return (
      <div className="cm">
        <div className="cm__header">
          <h2 className="cm__title">My Account</h2>
        </div>
        <div className="cm__actions">
          <button className="cm__btn cm__btn--outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
        {loading ? <Spinner text="Loading…" /> : <UserProfileView />}
      </div>
    );
  }

  const selectedCodes = getSelectedClientCodes();

  return (
    <div className="cm">
      <div className="cm__header">
        <h2 className="cm__title">Client Groups</h2>
      </div>

      <div className="cm__actions">
        <button className="cm__btn cm__btn--outline" onClick={handleAuthAll} disabled={authenticatingAll}>
          <Power size={14} />
          {authenticatingAll ? 'Authenticating…' : 'Auth All'}
        </button>
        <button className="cm__btn cm__btn--outline" onClick={handleRefresh} disabled={loading || groupsLoading}>
          <RefreshCw size={14} className={(loading || groupsLoading) ? 'spin' : ''} />
          Refresh
        </button>
        <button className="cm__btn cm__btn--secondary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} />
          Add Client
        </button>
        <button className="cm__btn cm__btn--primary" onClick={() => setShowCreateGroupModal(true)}>
          <Plus size={15} />
          New Group
        </button>
      </div>

      <div className="cm__groups">
        {groupsLoading ? (
          <Spinner text="Loading groups…" />
        ) : Object.keys(groups).length === 0 ? (
          <div className="cm__empty">
            <p>No groups yet. Create your first group.</p>
          </div>
        ) : (
          Object.entries(groups).map(([groupName, groupEntry]: [string, GroupEntry]) => {
            const isExpanded   = expandedGroups.has(groupName);
            const isChecked    = selectedGroups.has(groupName);
            const groupClients = Object.entries(groupEntry.clients ?? {});

            return (
              <div key={groupName} className={`cm__group-card${isChecked ? ' cm__group-card--selected' : ''}`}>
                <div className="cm__group-header">
                  <input type="checkbox" className="cm__group-checkbox" checked={isChecked} onChange={() => toggleSelectGroup(groupName)} />
                  <span className="cm__group-chevron" onClick={() => toggleExpand(groupName)}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <span className="cm__group-name" onClick={() => toggleExpand(groupName)}>
                    {groupName}
                  </span>
                  <span className="cm__group-count">{groupClients.length} clients</span>
                  <div className="cm__group-actions">
                    <button className="cm__icon-btn" title="Add clients to group" onClick={() => setAddToGroup(groupName)}>
                      <UserPlus size={14} />
                    </button>
                    <button className="cm__icon-btn cm__icon-btn--danger" title="Delete group" onClick={() => handleDeleteGroup(groupName)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <table className="cm__table cm__table--nested">
                    <thead>
                      <tr>
                        <th>Client Code</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Auth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupClients.length === 0 ? (
                        <tr><td colSpan={4} className="cm__empty-row">No clients in this group</td></tr>
                      ) : (
                        groupClients.map(([code, details]) => (
                          <tr key={code}>
                            <td><span className="cm__broker">{code}</span></td>
                            <td>{details.email ?? '—'}</td>
                            <td>
                              <span className={`cm__status ${details.is_active ? 'cm__status--active' : 'cm__status--inactive'}`}>
                                {details.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <span className={`cm__status ${details.is_authenticated ? 'cm__status--active' : 'cm__status--inactive'}`}>
                                {details.is_authenticated ? 'Authenticated' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>

      {Object.keys(groups).length > 0 && (
        <div className="cm__footer">
          <span className="cm__footer-hint">
            {selectedGroups.size > 0
              ? `${selectedGroups.size} group${selectedGroups.size > 1 ? 's' : ''} · ${selectedCodes.length} clients`
              : 'Select groups to proceed'}
          </span>
          <button className="cm__btn cm__btn--proceed" disabled={selectedGroups.size === 0} onClick={handleProceed}>
            Proceed ({selectedCodes.length})
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} />
      )}
      {showCreateGroupModal && (
        <CreateGroupModal
          allClientCodes={allClientCodes}
          masterCode={user?.id ?? user?.name ?? ''}
          onClose={() => setShowCreateGroupModal(false)}
        />
      )}
      {addToGroup && (
        <AddToGroupModal
          groupName={addToGroup}
          existingCodes={Object.keys(groups[addToGroup]?.clients ?? {})}
          allClientCodes={allClientCodes}
          onClose={() => setAddToGroup(null)}
        />
      )}

      {/* ── Confirm Delete Modal (replaces window.confirm) ── */}
      {confirmDeleteGroup && (
        <div className="cm-modal-overlay" onClick={() => setConfirmDeleteGroup(null)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-modal__icon cm-modal__icon--danger">
              <Trash2 size={20} />
            </div>
            <h3>Delete Group?</h3>
            <p>
              Are you sure you want to delete <strong>"{confirmDeleteGroup}"</strong>?
              <br />
              <span className="cm-modal__note">Clients will NOT be deleted.</span>
            </p>
            <div className="cm-modal__actions">
              <button className="cm__btn cm__btn--outline" onClick={() => setConfirmDeleteGroup(null)}>
                Cancel
              </button>
              <button className="cm__btn cm__btn--danger" onClick={confirmDelete}>
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};