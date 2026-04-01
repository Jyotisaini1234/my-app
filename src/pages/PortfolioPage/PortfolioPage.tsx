import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, BarChart2, RefreshCw,
  AlertCircle, CheckCircle, Clock, ChevronUp, ChevronDown, Minus,
} from 'lucide-react';
import './PortfolioPage.scss';
import { Spinner } from '../../components/common/Spinner/Spinner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchClients } from '../../store/slice/clientsSlice/clientsSlice';
import { Client, HoldingDetail } from '../../types/type';
import { HoldingsDrawer } from '../../components/common/HoldingsDrawer/HoldingsDrawer';

// ─── Formatters ───────────────────────────────────────────────────────────────
const inr = (v: number | null | undefined) => {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${v < 0 ? '−' : ''}₹${formatted}`;
};

const pct = (v: number | null | undefined) => {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
};

// ─── Broker helpers ───────────────────────────────────────────────────────────

/** Returns enabled broker names from c.brokers (source of truth) */
const getBrokerNames = (c: Client): string[] => {
  const brokers = (c as any)?.brokers ?? {};
  return Object.keys(brokers).filter(b => brokers[b]?.enabled !== false);
};

/** Returns portfolio data for a given broker key (e.g. motilal_portfolio) */
const getBrokerPortfolio = (c: Client, broker: string): any | null =>
  (c as any)[`${broker.toLowerCase()}_portfolio`] ?? null;

/** Returns all broker portfolios as a map — used by HoldingsDrawer */
const getAllBrokerPortfolios = (c: Client): Record<string, any> =>
  getBrokerNames(c).reduce((acc, broker) => {
    const p = getBrokerPortfolio(c, broker);
    if (p) acc[broker] = p;
    return acc;
  }, {} as Record<string, any>);

/** Returns broker userId from c.brokers map */
const getBrokerUserId = (c: Client, broker: string): string => {
  const b = (c as any)?.brokers?.[broker];
  return b?.user_id ?? b?.userId ?? broker;
};

/** Returns available cash for a given broker */
const getBrokerAvailableCash = (c: Client, broker: string): number => {
  const b = (c as any)?.balances?.[broker];
  // If balance fetch failed (stat: Not_Ok / status: ERROR), treat as 0
  if (!b || b.stat === 'Not_Ok' || b.status === 'ERROR') return 0;
  return b.available_cash ?? 0;
};

/** Normalises a raw holding entry into HoldingDetail shape */
const normaliseHolding = (h: any, broker: string): HoldingDetail => ({
  name:            h.name ?? h.symbol ?? '—',
  symbol:          h.symbol,
  exchange:        h.exchange,
  isin:            h.isin,
  quantity:        h.quantity ?? h.qty ?? 0,
  avg_price:       h.avg_price ?? 0,
  ltp:             h.ltp      ?? 0,
  invested_amount: h.invested_amount ?? 0,
  current_value:   h.current_value   ?? 0,
  profit_loss:     h.profit_loss     ?? 0,
  profit_loss_pct: h.profit_loss_pct ?? 0,
  source:          broker,
  nse_token:       h.nse_token ?? 0,
  bse_token:       h.bse_token ?? 0,
});

/** Returns HoldingDetail[] for a single broker */
const getBrokerHoldings = (c: Client, broker: string): HoldingDetail[] =>
  (getBrokerPortfolio(c, broker)?.holdings ?? []).map((h: any) => normaliseHolding(h, broker));

/** Returns combined HoldingDetail[] across all brokers */
const getAllHoldings = (c: Client): HoldingDetail[] =>
  getBrokerNames(c).flatMap(broker => getBrokerHoldings(c, broker));

// ─── Aggregated totals (hero cards) ──────────────────────────────────────────
const getInvested = (c: Client): number =>
  getBrokerNames(c).reduce((s, b) => s + (getBrokerPortfolio(c, b)?.invested_amount ?? 0), 0)
  || (c as any).invested_amount || 0;

const getCurrent = (c: Client): number =>
  getBrokerNames(c).reduce((s, b) => s + (getBrokerPortfolio(c, b)?.current_value ?? 0), 0)
  || (c as any).current_value || 0;

const getTotalHoldings = (c: Client): number =>
  getBrokerNames(c).reduce((s, b) => s + (getBrokerPortfolio(c, b)?.total_holdings ?? 0), 0)
  || (c as any).total_holdings || 0;

const getAvailableCash = (c: Client): number => {
  const bal = (c as any)?.balances;
  if (bal && Object.keys(bal).length > 0) {
    return Object.entries(bal).reduce((s: number, [, b]: [string, any]) => {
      if (!b || b.stat === 'Not_Ok' || b.status === 'ERROR') return s;
      return s + (b.available_cash ?? 0);
    }, 0);
  }
  return (c as any).available_cash ?? 0;
};

const getUsedMargin = (c: Client): number => {
  const bal = (c as any)?.balances;
  if (bal && Object.keys(bal).length > 0) {
    return Object.entries(bal).reduce((s: number, [, b]: [string, any]) => {
      if (!b || b.stat === 'Not_Ok' || b.status === 'ERROR') return s;
      return s + (b.used_margin ?? 0);
    }, 0);
  }
  return (c as any).used_margin ?? 0;
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const cls =
    status === 'Active'   ? 'active'   :
    status === 'Inactive' ? 'inactive' : 'pending';
  return (
    <span className={`pf-status pf-status--${cls}`}>
      {status ?? 'Unknown'}
    </span>
  );
};

// ─── Broker badge cell ────────────────────────────────────────────────────────
const BrokerCell: React.FC<{ broker: string }> = ({ broker }) => (
  <div className="pf-broker-cell">
    <span className={`pf-broker-badge pf-broker-badge--${broker.toLowerCase()}`}>
      {broker.substring(0, 2)}
    </span>
    <span className="pf-broker-name">
      {broker.charAt(0) + broker.slice(1).toLowerCase()}
    </span>
  </div>
);

// ─── P&L cells ────────────────────────────────────────────────────────────────
const PnlValue: React.FC<{ pl: number; hasHoldings: boolean }> = ({ pl, hasHoldings }) => {
  if (!hasHoldings) return <span className="pf-dim">—</span>;
  const isProfit = pl > 0;
  const isLoss   = pl < 0;
  return (
    <span className={`pf-pnl ${isProfit ? 'pf-pnl--up' : isLoss ? 'pf-pnl--down' : 'pf-pnl--zero'}`}>
      {isProfit ? <TrendingUp size={12} /> : isLoss ? <TrendingDown size={12} /> : null}
      {inr(pl)}
    </span>
  );
};

const PnlPct: React.FC<{ plPct: number; hasHoldings: boolean }> = ({ plPct, hasHoldings }) => {
  if (!hasHoldings) return <span className="pf-dim">—</span>;
  const isProfit = plPct > 0;
  const isLoss   = plPct < 0;
  return (
    <span className={`pf-badge ${isProfit ? 'pf-badge--up' : isLoss ? 'pf-badge--down' : 'pf-badge--zero'}`}>
      {pct(plPct)}
    </span>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = 'client_code' | 'invested' | 'current' | 'profit_loss' | 'profit_loss_pct' | 'available_cash';
type SortDir  = 'asc' | 'desc';

interface DrawerState {
  client:           Client;
  broker?:          string;
  holdings:         HoldingDetail[];
  brokerPortfolios: Record<string, any>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const PortfolioPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: clients, loading, isFetched } = useAppSelector(s => s.clients);
  const [sortKey, setSortKey] = useState<SortKey>('profit_loss_pct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter,  setFilter]  = useState<'all' | 'profit' | 'loss' | 'zero'>('all');
  const [search,  setSearch]  = useState('');
  const [drawer,  setDrawer]  = useState<DrawerState | null>(null);
  React.useEffect(() => {if (!isFetched) dispatch(fetchClients()); }, [isFetched, dispatch]);
  const clientList = Object.values(clients) as Client[];
  const totalInvested  = clientList.reduce((s, c) => s + getInvested(c),      0);
  const totalCurrent   = clientList.reduce((s, c) => s + getCurrent(c),       0);
  const totalPnl       = totalCurrent - totalInvested;
  const totalPnlPct    = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalAvailable = clientList.reduce((s, c) => s + getAvailableCash(c), 0);
  const totalUsed      = clientList.reduce((s, c) => s + getUsedMargin(c),    0);
  const inProfit       = clientList.filter(c => (getCurrent(c) - getInvested(c)) > 0).length;
  const inLoss         = clientList.filter(c => (getCurrent(c) - getInvested(c)) < 0).length;
  const withHoldings   = clientList.filter(c => getTotalHoldings(c) > 0).length;

  const getSortVal = (c: Client, key: SortKey): number | string => {
    switch (key) {
      case 'client_code':     return c.client_code;
      case 'invested':        return getInvested(c);
      case 'current':         return getCurrent(c);
      case 'profit_loss':     return getCurrent(c) - getInvested(c);
      case 'profit_loss_pct': {
        const inv = getInvested(c);
        return inv > 0 ? ((getCurrent(c) - inv) / inv) * 100 : 0;
      }
      case 'available_cash':  return getAvailableCash(c);
      default: return 0;
    }
  };

  const sorted = [...clientList]
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.client_code.toLowerCase().includes(q) ||
        (c.client_name ?? '').toLowerCase().includes(q)
      );
    })
    .filter(c => {
      const pl = getCurrent(c) - getInvested(c);
      if (filter === 'profit') return pl > 0;
      if (filter === 'loss')   return pl < 0;
      if (filter === 'zero')   return pl === 0;
      return true;
    })
    .sort((a, b) => {
      const av = getSortVal(a, sortKey);
      const bv = getSortVal(b, sortKey);
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
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

  const renderSingleBrokerRow = (client: Client) => {
    const inv        = getInvested(client);
    const cur        = getCurrent(client);
    const pl         = cur - inv;
    const plPct      = inv > 0 ? (pl / inv) * 100 : 0;
    const avail      = getAvailableCash(client);
    const totalHold  = getTotalHoldings(client);
    const broker     = getBrokerNames(client)[0] ?? null;
    const isNegBal   = avail < 0;

    return (
      <tr key={client.client_code} className={`pf-row${isNegBal ? ' pf-row--warn' : ''}`}>
        <td className="pf-td pf-td--code">
          <div className="pf-client">
            <div className="pf-client__avatar">
              {(client.client_name ?? client.client_code)[0]?.toUpperCase()}
            </div>
            <div className="pf-client__info">
              <span className="pf-client__code">
                {broker ? getBrokerUserId(client, broker) : client.client_code}
              </span>
              {client.client_name && client.client_name !== '—' && (
                <span className="pf-client__name">{client.client_name}</span>
              )}
            </div>
          </div>
        </td>

        <td className="pf-td">
          <StatusBadge status={client.account_status} />
        </td>

        <td className="pf-td">
          {broker
            ? <BrokerCell broker={broker} />
            : <span className="pf-dim">—</span>}
        </td>

        <td className="pf-td pf-td--num">
          {totalHold > 0 ? <span className="pf-num">{inr(inv)}</span> : <span className="pf-dim">—</span>}
        </td>
        <td className="pf-td pf-td--num">
          {totalHold > 0 ? <span className="pf-num">{inr(cur)}</span> : <span className="pf-dim">—</span>}
        </td>
        <td className="pf-td pf-td--num">
          <PnlValue pl={pl} hasHoldings={totalHold > 0} />
        </td>
        <td className="pf-td pf-td--num">
          <PnlPct plPct={plPct} hasHoldings={totalHold > 0} />
        </td>
        <td className="pf-td pf-td--num">
          <span className={`pf-avail ${isNegBal ? 'pf-avail--neg' : 'pf-avail--pos'}`}>
            {isNegBal && <AlertCircle size={11} />}
            {inr(avail)}
          </span>
        </td>
        <td
          className="pf-td pf-td--num"
          style={{ cursor: totalHold > 0 ? 'pointer' : 'default' }}
          onClick={() => totalHold > 0 && setDrawer({
            client,
            holdings:         getAllHoldings(client),
            brokerPortfolios: getAllBrokerPortfolios(client),
          })}
        >
          {totalHold > 0
            ? <span className="pf-chip pf-chip--clickable">{totalHold}</span>
            : <span className="pf-dim">0</span>}
        </td>
      </tr>
    );
  };

  const renderMultiBrokerRows = (client: Client) => {
    const brokerNames = getBrokerNames(client);

    return brokerNames.map((broker, brokerIdx) => {
      const portfolio  = getBrokerPortfolio(client, broker);
      const inv        = portfolio?.invested_amount ?? 0;
      const cur        = portfolio?.current_value   ?? 0;
      const pl         = cur - inv;
      const plPct      = inv > 0 ? (pl / inv) * 100 : 0;
      const holdCount  = portfolio?.total_holdings  ?? 0;
      const available  = getBrokerAvailableCash(client, broker);
      const isNegBal   = available < 0;
      const isFirst    = brokerIdx === 0;
      const isLast     = brokerIdx === brokerNames.length - 1;
      const bHoldings  = getBrokerHoldings(client, broker);

      return (
        <tr key={`${client.client_code}-${broker}`} className={[ 'pf-row', 'pf-row--broker', isFirst ? 'pf-row--broker-first' : 'pf-row--broker-sub', isLast  ? 'pf-row--broker-last'  : '',  isNegBal ? 'pf-row--warn' : '', ].filter(Boolean).join(' ')} >
          <td className="pf-td pf-td--code">
            <div className="pf-client">
              <div className={`pf-client__avatar pf-client__avatar--${broker.toLowerCase()}`}>
                {isFirst
                  ? (client.client_name ?? client.client_code)[0]?.toUpperCase()
                  : broker.substring(0, 2).toUpperCase()}
              </div>
              <div className="pf-client__info">
                <span className="pf-client__code">{getBrokerUserId(client, broker)}</span>
                {client.client_name && client.client_name !== '—' && (
                  <span className="pf-client__name">{client.client_name}</span>
                )}
              </div>
            </div>
          </td>

          <td className="pf-td">
            <StatusBadge status={client.account_status} />
          </td>

          <td className="pf-td">
            <BrokerCell broker={broker} />
          </td>

          <td className="pf-td pf-td--num">
            {holdCount > 0
              ? <span className="pf-num">{inr(inv)}</span>
              : <span className="pf-dim">—</span>}
          </td>
          <td className="pf-td pf-td--num">
            {holdCount > 0
              ? <span className="pf-num">{inr(cur)}</span>
              : <span className="pf-dim">—</span>}
          </td>
          <td className="pf-td pf-td--num">
            <PnlValue pl={pl} hasHoldings={holdCount > 0} />
          </td>
          <td className="pf-td pf-td--num">
            <PnlPct plPct={plPct} hasHoldings={holdCount > 0} />
          </td>
          <td className="pf-td pf-td--num">
            <span className={`pf-avail ${isNegBal ? 'pf-avail--neg' : 'pf-avail--pos'}`}>
              {isNegBal && <AlertCircle size={11} />}
              {inr(available)}
            </span>
          </td>
          <td
            className="pf-td pf-td--num"
            style={{ cursor: holdCount > 0 ? 'pointer' : 'default' }}
            onClick={() => holdCount > 0 && setDrawer({
              client,
              broker,
              holdings:         bHoldings,
              brokerPortfolios: { [broker]: portfolio },
            })}
          >
            {holdCount > 0
              ? <span className="pf-chip pf-chip--clickable">{holdCount}</span>
              : <span className="pf-dim">0</span>}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="pf-page">
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

      {/* ── Pills ─────────────────────────────────────────────────────────── */}
      <div className="pf-pills">
        <div className="pf-pill pf-pill--green"><CheckCircle size={13} /><span>{inProfit} in profit</span></div>
        <div className="pf-pill pf-pill--red"  ><AlertCircle size={13} /><span>{inLoss} in loss</span></div>
        <div className="pf-pill pf-pill--blue" ><BarChart2   size={13} /><span>{withHoldings} with holdings</span></div>
        <div className="pf-pill pf-pill--orange"><Clock      size={13} /><span>Used margin {inr(totalUsed)}</span></div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
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
        <button
          className="pf-refresh"
          onClick={() => dispatch(fetchClients())}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="pf-table-wrap">
        <table className="pf-table">
          <thead>
            <tr>
              <th className="pf-th pf-th--code" onClick={() => handleSort('client_code')}>
                Client <SortIcon col="client_code" />
              </th>
              <th className="pf-th pf-th--status">Status</th>
              <th className="pf-th">Broker</th>
              <th className="pf-th pf-th--num" onClick={() => handleSort('invested')}>
                Invested <SortIcon col="invested" />
              </th>
              <th className="pf-th pf-th--num" onClick={() => handleSort('current')}>
                Current <SortIcon col="current" />
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
              <tr>
                <td colSpan={9} className="pf-empty">No clients match the filter</td>
              </tr>
            )}

            {sorted.map(client =>
              getBrokerNames(client).length <= 1
                ? renderSingleBrokerRow(client)
                : renderMultiBrokerRows(client)
            )}
          </tbody>
        </table>
      </div>

      {/* ── Holdings Drawer ───────────────────────────────────────────────── */}
      {drawer && (
        <HoldingsDrawer
          clientCode={
            drawer.broker
              ? getBrokerUserId(drawer.client, drawer.broker)
              : drawer.client.client_code
          }
          clientName={drawer.client.client_name}
          holdings={drawer.holdings}
          brokerPortfolios={drawer.brokerPortfolios}
          onClose={() => setDrawer(null)}
        />
      )}

      <div className="pf-footer">
        Showing {sorted.length} of {clientList.length} clients
      </div>
    </div>
  );
};