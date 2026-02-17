import React, { useEffect } from 'react';
import {Users,TrendingUp, Activity,ShieldCheck,BarChart2, PlusCircle, Power, History} from 'lucide-react';
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
    dispatch(fetchClients());
    dispatch(fetchTradeHistory({}));
  }, [dispatch]);

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
    },
    {
      icon: <TrendingUp size={18} />,
      label: 'Bulk Trade',
      desc: 'Execute orders across all clients',
      page: 'bulk-trading' as NavPage,
    },
    {
      icon: <Power size={18} />,
      label: 'Auth All',
      desc: 'Authenticate all active sessions',
      page: 'clients' as NavPage,
    },
    {
      icon: <History size={18} />,
      label: 'View History',
      desc: 'Review past trade executions',
      page: 'trade-history' as NavPage,
    },
  ];

  return (
    <div className="dashboard">
      {/* Stats Row */}
      <div className="dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__info">
            <span className="stat-card__label">Total Clients</span>
            <span className="stat-card__value">{totalClients}</span>
            <span className="stat-card__change">{activeClients} active</span>
          </div>
          <div className="stat-card__icon stat-card__icon--blue">
            <Users size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__info">
            <span className="stat-card__label">Authenticated</span>
            <span className="stat-card__value">{authClients}</span>
            <span className="stat-card__change">
              {totalClients > 0 ? Math.round((authClients / totalClients) * 100) : 0}% of total
            </span>
          </div>
          <div className="stat-card__icon stat-card__icon--green">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__info">
            <span className="stat-card__label">Total Trades</span>
            <span className="stat-card__value">{totalTrades}</span>
            <span className="stat-card__change">All time</span>
          </div>
          <div className="stat-card__icon stat-card__icon--orange">
            <Activity size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__info">
            <span className="stat-card__label">Broker</span>
            <span className="stat-card__value" style={{ fontSize: 18, marginTop: 2 }}>
              Motilal
            </span>
            <span className="stat-card__change">API Active</span>
          </div>
          <div className="stat-card__icon stat-card__icon--purple">
            <BarChart2 size={20} />
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="dashboard__row">
        {/* Recent Activity */}
        <div className="recent-activity">
          <div className="recent-activity__head">
            <h3>Recent Trades</h3>
            <a onClick={() => onNavigate('trade-history')} style={{ cursor: 'pointer' }}>
              View all →
            </a>
          </div>
          <div className="recent-activity__list">
            {trades.length === 0 ? (
              <div className="recent-activity__empty">
                No recent trades. Place your first bulk trade to get started.
              </div>
            ) : (
              trades.slice(0, 6).map((t, i) => (
                <div key={t.id || i} className="recent-activity__item">
                  <div className="recent-activity__item-icon">
                    <TrendingUp size={16} />
                  </div>
                  <div className="recent-activity__item-content">
                    <strong>{t.symbol || t.smallcase || 'Trade'}</strong>
                    <span>{t.clientCode || 'Multiple clients'}</span>
                  </div>
                  <div className="recent-activity__item-meta">
                    <span
                      className={`amount amount--${
                        t.orderType?.toUpperCase() === 'BUY' ? 'buy' : 'sell'
                      }`}
                    >
                      {t.orderType || '—'}
                    </span>
                    <time>
                      {t.date ? new Date(t.date).toLocaleDateString('en-IN') : '—'}
                    </time>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="quick-actions__head">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions__grid">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                className="quick-actions__btn"
                onClick={() => onNavigate(qa.page)}
              >
                <div className="quick-actions__btn-icon">{qa.icon}</div>
                <span className="quick-actions__btn-label">{qa.label}</span>
                <span className="quick-actions__btn-desc">{qa.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};