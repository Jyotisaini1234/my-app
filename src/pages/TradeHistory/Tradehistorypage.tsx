import React, { useEffect } from 'react';
import { RefreshCw, Eye, RotateCcw, Download } from 'lucide-react';

import './TradeHistoryPage.scss';
import { Spinner } from '../../components/common/Spinner/Spinner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTradeHistory, setFilters } from '../../store/slice/tradeHistorySlice/tradeHistorySlice';
import { Button } from '../../components/common/Button/Button';

const STATUS_MAP: Record<string, string> = {
  estimated: 'estimated',
  executed: 'executed',
  executing: 'executing',
  failed: 'failed',
};

function statusClass(s?: string): string {
  if (!s) return '';
  return `status-badge status-badge--${STATUS_MAP[s.toLowerCase()] || 'estimated'}`;
}

export const TradeHistoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, filters } = useAppSelector((s) => s.tradeHistory);

  useEffect(() => {
    dispatch(fetchTradeHistory({}));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(
      fetchTradeHistory({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        clientCode: filters.clientCode || undefined,
      })
    );
  };

  const handleFilter = (key: keyof typeof filters, val: string) => {
    dispatch(setFilters({ [key]: val }));
  };

  return (
    <div className="trade-history">
      {/* Header */}
      <div className="trade-history__header">
        <h2>Trade History</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={14} />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? 'spin' : ''} />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="trade-history__filters">
        <label>Type</label>
        <select
          value={filters.type}
          onChange={(e) => handleFilter('type', e.target.value)}
        >
          <option value="All">All Trade Types</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>

        <div className="filter-sep" />

        <label>Client</label>
        <input
          placeholder="Client Code"
          value={filters.clientCode}
          onChange={(e) => handleFilter('clientCode', e.target.value.toUpperCase())}
        />

        <div className="filter-sep" />

        <label>From</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilter('startDate', e.target.value)}
        />

        <label>To</label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilter('endDate', e.target.value)}
        />

        <Button variant="accent" size="sm" onClick={handleRefresh}>
          Apply
        </Button>
      </div>

      {/* Table */}
      <div className="trade-history__table-wrap">
        {loading ? (
          <Spinner text="Loading trade history…" />
        ) : data.length === 0 ? (
          <div className="trade-history__empty">
            <p>No trade records found. Adjust your filters or refresh.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Symbol / Smallcase</th>
                <th>Order Type</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.id || row.tradeId || i}>
                  <td>
                    <span className="trade-id">
                      {row.tradeId || row.id || `#${String(i + 1).padStart(3, '0')}`}
                    </span>
                  </td>
                  <td>{row.symbol || row.smallcase || '—'}</td>
                  <td>
                    <span
                      className={
                        row.orderType?.toUpperCase() === 'BUY'
                          ? 'order-type-buy'
                          : row.orderType?.toUpperCase() === 'SELL'
                          ? 'order-type-sell'
                          : ''
                      }
                    >
                      {row.orderType || '—'}
                    </span>
                  </td>
                  <td>{row.quantity ?? '—'}</td>
                  <td>{row.date || row.createdAt ? new Date(row.date || row.createdAt!).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <span className={statusClass(row.status)}>
                      {row.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="action-btn" title="View">
                        <Eye size={13} />
                      </button>
                      <button className="action-btn" title="Replay">
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};