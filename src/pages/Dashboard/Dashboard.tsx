import React, { useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Activity,
  ShieldCheck,
  BarChart2,
  PlusCircle,
  Power,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
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
  const { data: clients } = useAppSelector((s) => s.clients);
  const { data: trades } = useAppSelector((s) => s.tradeHistory);

 useEffect(() => {
  if (Object.keys(clients).length === 0) {
    dispatch(fetchClients());
  }
  if (trades.length === 0) {
    dispatch(fetchTradeHistory({}));
  }
}, []);

  const clientList = Object.values(clients);
  const totalClients = clientList.length;
  const authClients = clientList.filter((c) => c.is_authenticated).length;
  const activeClients = clientList.filter((c) => c.is_active).length;
  const totalTrades = trades.length;

  const quickActions = [
    {
      icon: <PlusCircle size={18} />,
      label: 'Add Client',
      desc: 'Register a new broker account',
      page: 'clients' as NavPage,
      color: 'blue',
    },
    {
      icon: <TrendingUp size={18} />,
      label: 'Bulk Trade',
      desc: 'Execute orders across all clients',
      page: 'bulk-trading' as NavPage,
      color: 'green',
    },
    {
      icon: <Power size={18} />,
      label: 'Auth All',
      desc: 'Authenticate all active sessions',
      page: 'clients' as NavPage,
      color: 'orange',
    },
    {
      icon: <History size={18} />,
      label: 'View History',
      desc: 'Review past trade executions',
      page: 'trade-history' as NavPage,
      color: 'purple',
    },
  ];

  return (
    <div className="dashboard">

      {/* Stats Row */}
      <div className="dashboard__stats">

        <div className="stat-card">
          <div className="stat-card__body">
            <div className="stat-card__icon stat-card__icon--blue">
              <Users size={20} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__label">Total Clients</span>
              <span className="stat-card__value">{totalClients}</span>
            </div>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__badge stat-card__badge--success">
              <ArrowUpRight size={12} /> {activeClients} active
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__body">
            <div className="stat-card__icon stat-card__icon--green">
              <ShieldCheck size={20} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__label">Authenticated</span>
              <span className="stat-card__value">{authClients}</span>
            </div>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__badge stat-card__badge--success">
              <ArrowUpRight size={12} />
              {totalClients > 0 ? Math.round((authClients / totalClients) * 100) : 0}% of total
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__body">
            <div className="stat-card__icon stat-card__icon--orange">
              <Activity size={20} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__label">Total Trades</span>
              <span className="stat-card__value">{totalTrades}</span>
            </div>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__badge stat-card__badge--neutral">All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__body">
            <div className="stat-card__icon stat-card__icon--purple">
              <BarChart2 size={20} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__label">Broker</span>
              <span className="stat-card__value stat-card__value--sm">Motilal</span>
            </div>
          </div>
          <div className="stat-card__footer">
            <span className="stat-card__badge stat-card__badge--success">
              <span className="stat-card__dot" /> API Active
            </span>
          </div>
        </div>

      </div>

      {/* Middle Row */}
      <div className="dashboard__row">

        {/* Recent Trades */}
        <div className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Recent Trades</h3>
            <button className="panel__link" onClick={() => onNavigate('trade-history')}>
              View all →
            </button>
          </div>

          <div className="trade-table">
            <div className="trade-table__header">
              <span>Symbol / Smallcase</span>
              <span>Client</span>
              <span>Type</span>
              <span>Date</span>
            </div>
{trades.length === 0 ? (
  <div className="trade-table__empty">
    No recent trades. Place your first bulk trade to get started.
  </div>
) : (
  trades.slice(0, 6).map((t, i) => {
    const action = t.action || '—';
    const tradeDate = t.createdAt;
    const isPlace = action === 'PLACE_ORDER';

    return (
      <div key={t.id || i} className="trade-table__row">
        <div className="trade-table__symbol">
          <div className="trade-table__symbol-icon">
            <TrendingUp size={14} />
          </div>
          <strong>{t.clientName || t.clientCode || 'Trade'}</strong>
        </div>
        <span className="trade-table__client">
          {t.masterClientCode || t.clientCode || '—'}
        </span>
        <span className={`trade-table__badge trade-table__badge--${isPlace ? 'buy' : 'sell'}`}>
          {isPlace ? 'PLACE' : action === 'CANCEL_ORDER' ? 'CANCEL' : action}
        </span>
        <time className="trade-table__date">
          {tradeDate ? new Date(tradeDate).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          }) : '—'}
        </time>
      </div>
    );
  })
)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Quick Actions</h3>
          </div>
          <div className="quick-actions">
            {quickActions.map((qa) => (
              <button key={qa.label} className={`quick-action quick-action--${qa.color}`} onClick={() => onNavigate(qa.page)}  >
                <div className="quick-action__icon">{qa.icon}</div>
                <div className="quick-action__text">
                  <span className="quick-action__label">{qa.label}</span>
                  <span className="quick-action__desc">{qa.desc}</span>
                </div>
                <ArrowUpRight size={14} className="quick-action__arrow" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};