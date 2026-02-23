import React, { useEffect, useMemo } from 'react';
import { Users, TrendingUp, Activity, ShieldCheck,ArrowUpRight, ArrowDownRight, PlusCircle,Power, History, RefreshCw, CircleDollarSign,} from 'lucide-react';
import './DashboardPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchClients } from '../../store/slice/clientsSlice/clientsSlice';
import { fetchTradeHistory } from '../../store/slice/tradeHistorySlice/tradeHistorySlice';
import { NavPage } from '../../types/type';

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { data: clients, isFetched: clientsFetched } = useAppSelector(s => s.clients);
  const { data: trades, isFetched: tradesFetched }   = useAppSelector(s => s.tradeHistory);

  useEffect(() => {
    if (!clientsFetched) dispatch(fetchClients());
    if (!tradesFetched)  dispatch(fetchTradeHistory({}));
  }, []);

  const clientList   = useMemo(() => Object.values(clients), [clients]);
  const totalClients = clientList.length;
  const authClients  = useMemo(() => clientList.filter(c => c.is_authenticated).length, [clientList]);
  const activeClients= useMemo(() => clientList.filter(c => c.is_active).length, [clientList]);
  const placedTrades = useMemo(() => trades.filter(t => t.action === 'PLACE_ORDER').length, [trades]);
  const cancelTrades = useMemo(() => trades.filter(t => t.action === 'CANCEL_ORDER').length, [trades]);

  const stats = [
    {
      label: 'Total Clients',
      value: totalClients,
      sub: `${activeClients} active`,
      icon: <Users size={20} />,
      color: 'blue',
      trend: 'up',
    },
    {
      label: 'Authenticated',
      value: authClients,
      sub: `${totalClients > 0 ? Math.round((authClients / totalClients) * 100) : 0}% of total`,
      icon: <ShieldCheck size={20} />,
      color: 'green',
      trend: 'up',
    },
    {
      label: 'Orders Placed',
      value: placedTrades,
      sub: 'All time',
      icon: <TrendingUp size={20} />,
      color: 'orange',
      trend: 'up',
    },
    {
      label: 'Cancelled',
      value: cancelTrades,
      sub: 'All time',
      icon: <Activity size={20} />,
      color: 'purple',
      trend: cancelTrades > 0 ? 'down' : 'neutral',
    },
  ];

  const quickActions = [
    { icon: <PlusCircle size={16} />, label: 'Add Client',    desc: 'Register broker account', page: 'clients' as NavPage,       color: 'blue' },
    { icon: <TrendingUp size={16} />, label: 'Bulk Trade',    desc: 'Execute across all clients',page: 'bulk-trading' as NavPage, color: 'green' },
    { icon: <Power size={16} />,      label: 'Auth All',      desc: 'Authenticate sessions',    page: 'clients' as NavPage,       color: 'orange' },
    { icon: <History size={16} />,    label: 'View History',  desc: 'Past trade executions',    page: 'trade-history' as NavPage, color: 'purple' },
    { icon: <CircleDollarSign size={16}/>, label: 'Order Logs', desc: 'Live order tracking',   page: 'order-logs' as NavPage,    color: 'teal' },
    { icon: <RefreshCw size={16} />,  label: 'Re-authenticate', desc: 'Refresh all sessions',  page: 'clients' as NavPage,       color: 'red' },
  ];

  return (
    <div className="dashboard">

      {/* ── Stats ── */}
      <div className="dashboard__stats">
        {stats.map(s => (
          <div key={s.label} className={`stat-card stat-card--${s.color}`}>
            <div className="stat-card__head">
              <span className="stat-card__label">{s.label}</span>
              <div className="stat-card__icon">{s.icon}</div>
            </div>
            <div className="stat-card__value">{s.value}</div>
            <div className="stat-card__footer">
              {s.trend === 'up'   && <ArrowUpRight   size={12} className="trend trend--up" />}
              {s.trend === 'down' && <ArrowDownRight  size={12} className="trend trend--down" />}
              <span className="stat-card__sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main row ── */}
      <div className="dashboard__row">

        {/* Recent Trades */}
        <div className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Recent Orders</h3>
            <button className="panel__link" onClick={() => onNavigate('trade-history')}>
              View all →
            </button>
          </div>

          <div className="trade-table">
            <div className="trade-table__header">
              <span>Client</span>
              <span className="hide-mobile">Master</span>
              <span>Type</span>
              <span>Date</span>
            </div>

            {trades.length === 0 ? (
              <div className="trade-table__empty">
                No recent orders. Place your first bulk trade.
              </div>
            ) : (
              trades.slice(0, 8).map((t, i) => {
                const action  = t.action || '—';
                const isPlace = action === 'PLACE_ORDER';
                return (
                  <div key={t.id || i} className="trade-table__row">
                    <div className="trade-table__client-cell">
                      <div className="trade-table__avatar">
                        {(t.clientName || t.clientCode || 'T').slice(0, 1).toUpperCase()}
                      </div>
                      <span className="trade-table__name">
                        {t.clientName || t.clientCode || '—'}
                      </span>
                    </div>
                    <span className="trade-table__master hide-mobile">
                      {t.masterClientCode || '—'}
                    </span>
                    <span className={`trade-table__badge ${isPlace ? 'trade-table__badge--place' : 'trade-table__badge--cancel'}`}>
                      {isPlace ? 'PLACE' : 'CANCEL'}
                    </span>
                    <time className="trade-table__date">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </time>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="dashboard__right-col">

          {/* Quick Actions */}
          <div className="panel">
            <div className="panel__head">
              <h3 className="panel__title">Quick Actions</h3>
            </div>
            <div className="quick-actions">
              {quickActions.map(qa => (
                <button
                  key={qa.label}
                  className={`quick-action quick-action--${qa.color}`}
                  onClick={() => onNavigate(qa.page)}
                >
                  <div className="quick-action__icon">{qa.icon}</div>
                  <div className="quick-action__text">
                    <span className="quick-action__label">{qa.label}</span>
                    <span className="quick-action__desc">{qa.desc}</span>
                  </div>
                  <ArrowUpRight size={13} className="quick-action__arrow" />
                </button>
              ))}
            </div>
          </div>

          {/* Client summary */}
          <div className="panel panel--summary">
            <div className="panel__head">
              <h3 className="panel__title">Client Status</h3>
            </div>
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-item__label">Total Registered</span>
                <span className="summary-item__value">{totalClients}</span>
              </div>
              <div className="summary-item">
                <span className="summary-item__label">Active</span>
                <span className="summary-item__value summary-item__value--green">{activeClients}</span>
              </div>
              <div className="summary-item">
                <span className="summary-item__label">Authenticated</span>
                <span className="summary-item__value summary-item__value--green">{authClients}</span>
              </div>
              <div className="summary-item">
                <span className="summary-item__label">Inactive</span>
                <span className="summary-item__value summary-item__value--red">
                  {totalClients - activeClients}
                </span>
              </div>
              <div className="summary-item summary-item--bar">
                <span className="summary-item__label">Auth Rate</span>
                <div className="summary-bar">
                  <div
                    className="summary-bar__fill"
                    style={{ width: `${totalClients > 0 ? (authClients / totalClients) * 100 : 0}%` }}
                  />
                </div>
                <span className="summary-item__pct">
                  {totalClients > 0 ? Math.round((authClients / totalClients) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};