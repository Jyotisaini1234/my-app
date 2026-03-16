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

interface ClientsListProps { onNavigate: (page: NavPage) => void; }

const inr = (v: number | null | undefined, fallback = '—') => {
  if (v == null) return fallback;
  const abs = Math.abs(v);
  const str = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(abs);
  return `${v < 0 ? '−' : ''}₹${str}`;
};

const pct = (v: number | null | undefined) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

export const ClientsList: React.FC<ClientsListProps> = ({ onNavigate }) => {
  const dispatch      = useAppDispatch();
  const { showToast } = useToast();
  const { data: clients, loading, authenticatingAll, isFetched } = useAppSelector(s => s.clients);
  const { user } = useAppSelector(s => s.auth);
  const isMaster = user?.role === 'MASTER';
  const { data: groups = {}, isLoading: groupsLoading, refetch: refetchGroups } = useFetchGroupsQuery();
  const [deleteGroup] = useDeleteGroupMutation();

  const [showAddModal,         setShowAddModal]         = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [addToGroup,           setAddToGroup]           = useState<string | null>(null);
  const [expandedGroups,       setExpandedGroups]       = useState<Set<string>>(new Set());
  const [selectedGroups,       setSelectedGroups]       = useState<Set<string>>(new Set());
  const [confirmDeleteGroup,   setConfirmDeleteGroup]   = useState<string | null>(null);

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

  // ════════════════════════════════════════════════════════════════════════════
  // USER VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (!isMaster) {
    const myClient   = clientsList.find(c => c.client_code === user?.clientCode) ?? clientsList[0];
    const isActive   = myClient?.is_active;
    const displayName = myClient?.client_name && myClient.client_name !== '—'
      ? myClient.client_name
      : user?.name || user?.clientCode || 'User';

    // Portfolio values — will be null until enriched endpoint responds
    const invested  = myClient?.invested_amount  ?? null;
    const current   = myClient?.current_value    ?? null;
    const pnl       = myClient?.profit_loss      ?? null;
    const pnlPct    = myClient?.profit_loss_pct  ?? null;
    const holdings  = myClient?.total_holdings   ?? 0;
    const isProfit  = (pnl ?? 0) >= 0;

    // Balance values
    const avail    = myClient?.available_cash   ?? null;
    const used     = myClient?.used_margin      ?? null;
    const ledger   = myClient?.ledger_balance   ?? null;
    const collat   = myClient?.collateral_value ?? null;
    const isNegBal = avail != null && avail < 0;

    // Still loading first time
    if (loading && !myClient) return <Spinner text="Loading your account…" />;

    // Data is being fetched (client exists but enriched data not yet received)
    const isEnrichedLoading = loading || (
      myClient != null &&
      invested == null &&
      avail    == null
    );

    const infoRows = [
      { icon: <TagIcon />,               label: 'Client Code', value: user?.clientCode || '—', mono: true, accent: true },
      { icon: <AlternateEmailIcon />,     label: 'Email',       value: user?.email,             mono: true },
      { icon: <PhoneAndroidIcon />,       label: 'Phone',       value: user?.phone },
      { icon: <LocationOnOutlinedIcon />, label: 'City',        value: user?.city },
    ].filter(r => r.value);

    return (
      <div className="up">

        {/* ── Hero ── */}
        <div className="up__hero">
          <div className="up__hero-top">
            <span className="up__badge">
              <FiberManualRecordIcon className="up__badge-dot" />Client Portal
            </span>
            <span className={`up__chip up__chip--${isActive ? 'on' : 'off'}`}>
              {isActive ? <VerifiedUserIcon /> : <ErrorOutlineIcon />}
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="up__identity">
            <div className="up__avatar">{displayName[0]?.toUpperCase() ?? 'U'}</div>
            <div>
              <h2 className="up__name">{displayName}</h2>
              <span className="up__code">{user?.clientCode || '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Portfolio cards ── */}
        <div className="up__pf">

          {/* Loading shimmer while enriched data fetches */}
          {isEnrichedLoading && (
            <div className="up__pf-loading">
              <RefreshIcon className="spin" />
              <span>Loading portfolio &amp; balance…</span>
            </div>
          )}

          {/* Row 1: Invested + Current */}
          <div className="up__pf-row">
            <div className="up__pf-box">
              <ShowChartIcon className="up__pf-ico up__pf-ico--blue" />
              <span className="up__pf-lbl">Total Invested</span>
              <strong className="up__pf-val">{inr(invested)}</strong>
            </div>
            <div className="up__pf-box">
              <AccountBalanceIcon className="up__pf-ico up__pf-ico--purple" />
              <span className="up__pf-lbl">Current Value</span>
              <strong className="up__pf-val">{inr(current)}</strong>
            </div>
          </div>

          {/* Row 2: P&L — only show when data exists */}
          {pnl != null && (
            <div className={`up__pf-pnl up__pf-pnl--${isProfit ? 'profit' : 'loss'}`}>
              <div className="up__pf-pnl-left">
                {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
                <div>
                  <span className="up__pf-lbl">{isProfit ? 'Total Profit' : 'Total Loss'}</span>
                  <strong className="up__pf-amt">{inr(pnl)}</strong>
                </div>
              </div>
              <div className="up__pf-pnl-right">
                <span className="up__pf-pct">{pct(pnlPct)}</span>
                <span className="up__pf-holdings">{holdings} holdings</span>
              </div>
            </div>
          )}

          {/* Row 3: Balance boxes */}
          <div className="up__pf-row up__pf-row--3">
            <div className={`up__pf-box${isNegBal ? ' up__pf-box--warn' : ''}`}>
              {isNegBal
                ? <WarningAmberIcon className="up__pf-ico up__pf-ico--warn" />
                : <AccountBalanceWalletIcon className="up__pf-ico up__pf-ico--green" />}
              <span className="up__pf-lbl">Available Cash</span>
              <strong className={`up__pf-val${isNegBal ? ' up__pf-val--neg' : ''}`}>
                {inr(avail)}
              </strong>
              {isNegBal && <span className="up__pf-warn-tag">Deficit</span>}
            </div>
            <div className="up__pf-box">
              <AccountBalanceWalletIcon className="up__pf-ico up__pf-ico--orange" />
              <span className="up__pf-lbl">Used Margin</span>
              <strong className="up__pf-val">{inr(used)}</strong>
            </div>
            <div className="up__pf-box">
              <AccountBalanceIcon className="up__pf-ico up__pf-ico--blue" />
              <span className="up__pf-lbl">Ledger Balance</span>
              <strong className={`up__pf-val${(ledger ?? 0) < 0 ? ' up__pf-val--neg' : ''}`}>
                {inr(ledger)}
              </strong>
            </div>
          </div>

          {/* Row 4: Collateral — only if non-zero */}
          {collat != null && collat !== 0 && (
            <div className="up__pf-collateral">
              <span className="up__pf-lbl">Collateral (Pledged stocks)</span>
              <strong className="up__pf-val">{inr(collat)}</strong>
            </div>
          )}
        </div>

      <div className="up__body">
          <p className="up__section-lbl">Account Details</p>
          {infoRows.map(r => (
            <div key={r.label} className={`up__row${r.accent ? ' up__row--accent' : ''}`}>
              <span className="up__row-icon">{r.icon}</span>
              <div className="up__row-meta">
                <span className="up__row-lbl">{r.label}</span>
                <span className={`up__row-val${r.mono ? ' up__row-val--mono' : ''}`}>{r.value}</span>
              </div>
              {r.label === 'Client Code' && (
                <span className={`up__tag up__tag--${isActive ? 'ok' : 'err'}`}>
                  {isActive ? 'Live' : 'Off'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="up__actions">
          <button className="up__btn up__btn--primary" onClick={() => onNavigate('bulk-trading')}>
            <ShowChartIcon />Trade Now
          </button>
          <button className="up__btn up__btn--ghost" onClick={() => onNavigate('trade-history')}>
            <HistoryIcon />History
          </button>
          <button className="up__btn up__btn--ghost up__btn--full"
            onClick={handleRefresh} disabled={loading}>
            <RefreshIcon className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
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