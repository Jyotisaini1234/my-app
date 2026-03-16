import React, { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, BarChart2,
  RefreshCw, AlertCircle, CheckCircle, Clock,
  ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import './PortfolioPage.scss';
import { Spinner } from '../../components/common/Spinner/Spinner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchClients } from '../../store/slice/clientsSlice/clientsSlice';
import { Client } from '../../types/type';


const inr = (v: number | null | undefined) => {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(abs);
  return `${v < 0 ? '−' : ''}₹${formatted}`;
};

const pct = (v: number | null | undefined) => {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
};

type SortKey = 'client_code' | 'invested_amount' | 'current_value' | 'profit_loss' | 'profit_loss_pct' | 'available_cash';
type SortDir = 'asc' | 'desc';

export const PortfolioPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: clients, loading, isFetched } = useAppSelector(s => s.clients);

  const [sortKey, setSortKey] = useState<SortKey>('profit_loss_pct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter,  setFilter]  = useState<'all' | 'profit' | 'loss' | 'zero'>('all');
  const [search,  setSearch]  = useState('');

  useEffect(() => { if (!isFetched) dispatch(fetchClients()); }, [isFetched, dispatch]);

  const clientList = Object.values(clients) as Client[];

  // ── Aggregates ───────────────────────────────────────────────────────────
  const totalInvested  = clientList.reduce((s, c) => s + (c.invested_amount  ?? 0), 0);
  const totalCurrent   = clientList.reduce((s, c) => s + (c.current_value    ?? 0), 0);
  const totalPnl       = totalCurrent - totalInvested;
  const totalPnlPct    = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalAvailable = clientList.reduce((s, c) => s + (c.available_cash   ?? 0), 0);
  const totalUsed      = clientList.reduce((s, c) => s + (c.used_margin      ?? 0), 0);
  const inProfit       = clientList.filter(c => (c.profit_loss ?? 0) > 0).length;
  const inLoss         = clientList.filter(c => (c.profit_loss ?? 0) < 0).length;
  const withHoldings   = clientList.filter(c => (c.total_holdings ?? 0) > 0).length;

  // ── Sort + filter ─────────────────────────────────────────────────────────
  const sorted = [...clientList]
    .filter(c => {
      if (search) {
        const q = search.toLowerCase();
        return c.client_code.toLowerCase().includes(q) ||
               (c.client_name ?? '').toLowerCase().includes(q);
      }
      return true;
    })
    .filter(c => {
      const pl = c.profit_loss ?? 0;
      if (filter === 'profit') return pl > 0;
      if (filter === 'loss')   return pl < 0;
      if (filter === 'zero')   return pl === 0;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey as keyof Client] ?? 0;
      const bv = b[sortKey as keyof Client] ?? 0;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortDir === 'asc' ? an - bn : bn - an;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return <Minus size={11} className="th-sort th-sort--none" />;
    return sortDir === 'desc'
      ? <ChevronDown size={11} className="th-sort th-sort--active" />
      : <ChevronUp   size={11} className="th-sort th-sort--active" />;
  };

  if (loading && !isFetched) return <Spinner text="Loading portfolio…" />;

  return (
    <div className="pf-page">

      {/* ── Hero summary ───────────────────────────────────────────────────── */}
      <div className="pf-hero">
        <div className="pf-hero__bg" />

        <div className="pf-hero__card pf-hero__card--primary">
          <div className="pf-hero__card-icon"><BarChart2 size={20} /></div>
          <div className="pf-hero__card-body">
            <span className="pf-hero__card-lbl">Total Invested</span>
            <strong className="pf-hero__card-val">{inr(totalInvested)}</strong>
          </div>
        </div>

        <div className="pf-hero__card pf-hero__card--current">
          <div className="pf-hero__card-icon"><TrendingUp size={20} /></div>
          <div className="pf-hero__card-body">
            <span className="pf-hero__card-lbl">Current Value</span>
            <strong className="pf-hero__card-val">{inr(totalCurrent)}</strong>
          </div>
        </div>

        <div className={`pf-hero__card pf-hero__card--pnl pf-hero__card--${totalPnl >= 0 ? 'profit' : 'loss'}`}>
          <div className="pf-hero__card-icon">
            {totalPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className="pf-hero__card-body">
            <span className="pf-hero__card-lbl">Overall P&amp;L</span>
            <strong className="pf-hero__card-val">{inr(totalPnl)}</strong>
          </div>
          <span className="pf-hero__card-pct">{pct(totalPnlPct)}</span>
        </div>

        <div className="pf-hero__card pf-hero__card--balance">
          <div className="pf-hero__card-icon"><Wallet size={20} /></div>
          <div className="pf-hero__card-body">
            <span className="pf-hero__card-lbl">Available to Trade</span>
            <strong className="pf-hero__card-val">{inr(totalAvailable)}</strong>
          </div>
        </div>
      </div>

      {/* ── Stat pills ─────────────────────────────────────────────────────── */}
      <div className="pf-pills">
        <div className="pf-pill pf-pill--green">
          <CheckCircle size={13} />
          <span>{inProfit} in profit</span>
        </div>
        <div className="pf-pill pf-pill--red">
          <AlertCircle size={13} />
          <span>{inLoss} in loss</span>
        </div>
        <div className="pf-pill pf-pill--blue">
          <BarChart2 size={13} />
          <span>{withHoldings} with holdings</span>
        </div>
        <div className="pf-pill pf-pill--orange">
          <Clock size={13} />
          <span>Used margin {inr(totalUsed)}</span>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="pf-toolbar">
        <div className="pf-search">
          <input
            type="text"
            placeholder="Search client code or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pf-search__input"
          />
        </div>

        <div className="pf-filters">
          {(['all', 'profit', 'loss', 'zero'] as const).map(f => (
            <button
              key={f}
              className={`pf-filter ${filter === f ? 'pf-filter--on' : ''} pf-filter--${f}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'profit' ? '↑ Profit' : f === 'loss' ? '↓ Loss' : '— Zero'}
            </button>
          ))}
        </div>

        <button className="pf-refresh" onClick={() => dispatch(fetchClients())} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="pf-table-wrap">
        <table className="pf-table">
          <thead>
            <tr>
              <th className="pf-th pf-th--code" onClick={() => handleSort('client_code')}>
                Client <SortIcon col="client_code" />
              </th>
              <th className="pf-th pf-th--status">Status</th>
              <th className="pf-th pf-th--num" onClick={() => handleSort('invested_amount')}>
                Invested <SortIcon col="invested_amount" />
              </th>
              <th className="pf-th pf-th--num" onClick={() => handleSort('current_value')}>
                Current <SortIcon col="current_value" />
              </th>
              <th className="pf-th pf-th--num" onClick={() => handleSort('profit_loss')}>
                P&amp;L <SortIcon col="profit_loss" />
              </th>
              <th className="pf-th pf-th--num" onClick={() => handleSort('profit_loss_pct')}>
                P&amp;L % <SortIcon col="profit_loss_pct" />
              </th>
              <th className="pf-th pf-th--num" onClick={() => handleSort('available_cash')}>
                Available <SortIcon col="available_cash" />
              </th>
              <th className="pf-th pf-th--num">Holdings</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="pf-empty">No clients match the filter</td></tr>
            )}
            {sorted.map(client => {
              const pl         = client.profit_loss     ?? 0;
              const plPct      = client.profit_loss_pct ?? 0;
              const avail      = client.available_cash  ?? null;
              const inv        = client.invested_amount ?? 0;
              const cur        = client.current_value   ?? 0;
              const isProfit   = pl > 0;
              const isLoss     = pl < 0;
              const hasHoldings = (client.total_holdings ?? 0) > 0;
              const isNegBal   = avail != null && avail < 0;

              return (
                <tr key={client.client_code} className={`pf-row${isNegBal ? ' pf-row--warn' : ''}`}>

                  {/* Client code + name */}
                  <td className="pf-td pf-td--code">
                    <div className="pf-client">
                      <div className="pf-client__avatar">
                        {(client.client_name ?? client.client_code)[0]?.toUpperCase()}
                      </div>
                      <div className="pf-client__info">
                        <span className="pf-client__code">{client.client_code}</span>
                        {client.client_name && client.client_name !== '—' && (
                          <span className="pf-client__name">{client.client_name}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Account status */}
                  <td className="pf-td">
                    <span className={`pf-status pf-status--${
                      client.account_status === 'Active' ? 'active' :
                      client.account_status === 'Inactive' ? 'inactive' : 'pending'
                    }`}>
                      {client.account_status ?? 'Unknown'}
                    </span>
                  </td>

                  {/* Invested */}
                  <td className="pf-td pf-td--num">
                    {hasHoldings ? <span className="pf-num">{inr(inv)}</span> : <span className="pf-dim">—</span>}
                  </td>

                  {/* Current value */}
                  <td className="pf-td pf-td--num">
                    {hasHoldings ? <span className="pf-num">{inr(cur)}</span> : <span className="pf-dim">—</span>}
                  </td>

                  {/* P&L amount */}
                  <td className="pf-td pf-td--num">
                    {hasHoldings ? (
                      <span className={`pf-pnl ${isProfit ? 'pf-pnl--up' : isLoss ? 'pf-pnl--down' : 'pf-pnl--zero'}`}>
                        {isProfit ? <TrendingUp  size={12} /> :
                         isLoss   ? <TrendingDown size={12} /> : null}
                        {inr(pl)}
                      </span>
                    ) : <span className="pf-dim">—</span>}
                  </td>

                  {/* P&L % */}
                  <td className="pf-td pf-td--num">
                    {hasHoldings ? (
                      <span className={`pf-badge ${isProfit ? 'pf-badge--up' : isLoss ? 'pf-badge--down' : 'pf-badge--zero'}`}>
                        {pct(plPct)}
                      </span>
                    ) : <span className="pf-dim">—</span>}
                  </td>

                  {/* Available cash */}
                  <td className="pf-td pf-td--num">
                    {avail != null ? (
                      <span className={`pf-avail ${isNegBal ? 'pf-avail--neg' : 'pf-avail--pos'}`}>
                        {isNegBal && <AlertCircle size={11} />}
                        {inr(avail)}
                      </span>
                    ) : <span className="pf-dim">—</span>}
                  </td>

                  {/* Holdings count */}
                  <td className="pf-td pf-td--num">
                    {hasHoldings
                      ? <span className="pf-chip">{client.total_holdings}</span>
                      : <span className="pf-dim">0</span>}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pf-footer">
        Showing {sorted.length} of {clientList.length} clients
      </div>
    </div>
  );
};