import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LineChart, Search, RefreshCw, X, TrendingUp, TrendingDown,
  Minus, ChevronDown, AlertCircle, Loader2, BarChart2,
  Star, Trash2, CheckSquare, Square, Eye, ChevronLeft, ChevronRight,
} from 'lucide-react';
import './FnoWatchlistPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchScripMaster, fetchWatchlistLtp, FnoInstrument, WatchlistEntry,
  addToWatchlist, removeFromWatchlist, clearWatchlist,
  setSelectedExchange, setSearchQuery, setSelectedType, setActiveView,
} from '../../store/slice/Fnoslice/fnoWatchlistSlice';
import { fetchActiveClients } from '../../store/slice/clientsSlice/clientsSlice';
import { useToast } from '../../context/ToastContext/Toastcontext';
import { TRADE_BASE } from '../../utils/ApiConstants';
import { BrokerAccount } from '../../types/type';

const EXCHANGES  = ['NSEFO', 'BSEFO'];
const INST_TYPES = ['ALL', 'FUTIDX', 'FUTSTK', 'OPTIDX', 'OPTSTK'];
const TYPE_LABELS: Record<string, string> = {
  ALL: 'All', FUTIDX: 'Index Futures', FUTSTK: 'Stock Futures',
  OPTIDX: 'Index Options', OPTSTK: 'Stock Options',
};
const PAGE_SIZE = 15;

const fmt = (n: number, digits = 2) =>
  n == null ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const fmtVol = (n: number) => {
  if (!n) return '—';
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// Convert Unix timestamp (seconds) to "26-May-2026" format
const fmtExpiry = (expiry: string | number): string => {
  if (!expiry || expiry === '0') return '—';
  const num = Number(expiry);
  // If it's a Unix timestamp (10-digit seconds), convert it
  if (!isNaN(num) && num > 1_000_000_000) {
    return new Date(num * 1000).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
  // Already a string like "26-May-2026"
  return String(expiry);
};

const TypeBadge: React.FC<{ optionType: string; instrumentType: string }> = ({ optionType, instrumentType }) => {
  if (optionType === 'CE') return <span className="fno-badge fno-badge--ce">CE</span>;
  if (optionType === 'PE') return <span className="fno-badge fno-badge--pe">PE</span>;
  const label = instrumentType.includes('IDX') ? 'F-IDX' : 'F-STK';
  return <span className="fno-badge fno-badge--fut">{label}</span>;
};

const ChangeChip: React.FC<{ change: number; pct: number }> = ({ change, pct }) => {
  const dir = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  return (
    <span className={`change-chip change-chip--${dir}`}>
      {dir === 'up'   && <TrendingUp   size={10} />}
      {dir === 'down' && <TrendingDown size={10} />}
      {dir === 'flat' && <Minus        size={10} />}
      {change > 0 ? '+' : ''}{fmt(change)} ({pct > 0 ? '+' : ''}{fmt(pct)}%)
    </span>
  );
};

const MiniSparkBar: React.FC<{ open: number; low: number; high: number; ltp: number }> = ({ open, low, high, ltp }) => {
  const range   = high - low || 1;
  const ltpPct  = Math.min(100, Math.max(0, ((ltp  - low) / range) * 100));
  const openPct = Math.min(100, Math.max(0, ((open - low) / range) * 100));
  return (
    <div className="spark-bar" title={`L:${fmt(low)}  H:${fmt(high)}`}>
      <div className="spark-bar__track">
        <div className="spark-bar__open"  style={{ left: `${openPct}%` }} />
        <div className="spark-bar__fill"  style={{ width: `${ltpPct}%` }} />
        <div className="spark-bar__thumb" style={{ left: `${ltpPct}%` }} />
      </div>
      <div className="spark-bar__labels">
        <span>{fmt(low, 0)}</span>
        <span>{fmt(high, 0)}</span>
      </div>
    </div>
  );
};

// ── Pagination component ──
const Pagination: React.FC<{
  current: number; total: number; onChange: (p: number) => void;
}> = ({ current, total, onChange }) => {
  if (total <= 1) return null;

  const pages: (number | '…')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('…');
    pages.push(total);
  }

  return (
    <div className="fno-pagination">
      <button className="fno-pg-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>
        <ChevronLeft size={13} />
      </button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className="fno-pg-ellipsis">…</span>
          : <button
              key={p}
              className={`fno-pg-btn ${current === p ? 'fno-pg-btn--active' : ''}`}
              onClick={() => onChange(p as number)}
            >{p}</button>
      )}
      <button className="fno-pg-btn" disabled={current === total} onClick={() => onChange(current + 1)}>
        <ChevronRight size={13} />
      </button>
      <span className="fno-pg-info">Page {current}/{total}</span>
    </div>
  );
};

export const FnoWatchlistPage: React.FC = () => {
  const dispatch      = useAppDispatch();
  const { showToast } = useToast();

  const state    = useAppSelector(s => s.fnoWatchlist);
  const { user } = useAppSelector(s => s.auth);
  const { data: clients, isFetched: clientsFetched } = useAppSelector(s => s.clients);

  const clientCode         = user?.clientCode ?? '';
  const loggedInClientCode = (user as any)?.id || user?.clientCode;

  const {
    instruments, instrumentsLoading, instrumentsError, instrumentsFetched,
    watchlist, quotes, quotesLoading, quotesError, lastRefreshed,
    searchQuery, selectedExchange, selectedType, activeView,
  } = state;

  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const [selectedInstr,  setSelectedInstr]  = useState<FnoInstrument | WatchlistEntry | null>(null);
  const [direction,      setDirection]      = useState<'BUY' | 'SELL'>('BUY');
  const [orderLoading,   setOrderLoading]   = useState(false);
  const [panelClients,   setPanelClients]   = useState<string[]>([]);
  const [clientSearch,   setClientSearch]   = useState('');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [orderForm, setOrderForm] = useState({
    ordertype: 'MARKET', producttype: 'CARRYFORWARD',
    duration: 'DAY', price: '0', quantity: '',
  });

  useEffect(() => {
    if (!clientCode) return;
    if (!instrumentsFetched && !instrumentsLoading)
      dispatch(fetchScripMaster({ clientCode, exchange: selectedExchange }));
    if (!clientsFetched) dispatch(fetchActiveClients());
  }, [clientCode, selectedExchange, instrumentsFetched, instrumentsLoading, clientsFetched, dispatch]);

  const refreshWatchlistLtp = useCallback(() => {
    if (watchlist.length && clientCode)
      dispatch(fetchWatchlistLtp({ clientCode, symbols: watchlist }));
  }, [watchlist, clientCode, dispatch]);

  useEffect(() => {
    if (activeView !== 'watchlist' || !watchlist.length || !clientCode) return;
    refreshWatchlistLtp();
    const id = setInterval(refreshWatchlistLtp, 15_000);
    return () => clearInterval(id);
  }, [activeView, clientCode, watchlist.length, refreshWatchlistLtp]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedType, selectedExchange]);

  const activeClients = useMemo(() => Object.values(clients).filter((c: any) => c.is_active), [clients]);

  const brokerAccounts = useMemo((): BrokerAccount[] => {
    const items: BrokerAccount[] = [];
    activeClients.forEach((c: any) => {
      const bMap  = (c?.brokers ?? {}) as Record<string, any>;
      const keys  = Object.keys(bMap).filter(k => bMap[k]?.enabled !== false);
      const cName = c?.client_name && c.client_name !== '—' ? c.client_name : c.client_code;
      if (keys.length === 0) {
        items.push({
          clientCode: c.client_code, clientName: cName, brokerName: 'UNKNOWN',
          userId: c.user_id ?? '—', isAuthenticated: c.is_authenticated ?? false,
          isMaster: c.is_master, isActive: c.is_active,
          selectionKey: `${c.client_code}:UNKNOWN`,
        });
      } else {
        keys.forEach(bn => {
          const b = bMap[bn];
          items.push({
            clientCode: c.client_code, clientName: cName, brokerName: bn,
            userId: b?.user_id ?? c.user_id ?? '—', isAuthenticated: b?.is_authenticated ?? false,
            isMaster: c.is_master, isActive: c.is_active,
            selectionKey: `${c.client_code}:${bn}`,
          });
        });
      }
    });
    return items;
  }, [activeClients]);

  const filteredBrokerAccounts = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return brokerAccounts;
    return brokerAccounts.filter(a =>
      a.clientName.toLowerCase().includes(q) ||
      a.clientCode.toLowerCase().includes(q) ||
      a.brokerName.toLowerCase().includes(q)
    );
  }, [brokerAccounts, clientSearch]);

  const allAccSelected = brokerAccounts.length > 0 && brokerAccounts.every(a => panelClients.includes(a.selectionKey));

  const quoteMap = useMemo(() => {
    const m: Record<string, typeof quotes[0]> = {};
    quotes.forEach(q => { m[q.token] = q; });
    return m;
  }, [quotes]);

  const watchlistTokens = useMemo(() => new Set(watchlist.map(w => w.token)), [watchlist]);

  const filteredInstruments = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    return instruments.filter(i => {
      if (selectedType !== 'ALL' && i.instrumentType !== selectedType) return false;
      if (!q) return true;
      return i.symbol.toUpperCase().includes(q) || i.tradingSymbol.toUpperCase().includes(q) || i.name.toUpperCase().includes(q);
    });
  }, [instruments, searchQuery, selectedType]);

  const totalPages = Math.ceil(filteredInstruments.length / PAGE_SIZE);
  const pagedInstruments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredInstruments.slice(start, start + PAGE_SIZE);
  }, [filteredInstruments, currentPage]);

  const filteredWatchlist = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    return watchlist.filter(w => {
      if (selectedType !== 'ALL' && w.instrumentType !== selectedType) return false;
      if (!q) return true;
      return w.symbol.toUpperCase().includes(q) || w.tradingSymbol.toUpperCase().includes(q);
    });
  }, [watchlist, searchQuery, selectedType]);

  const toggleWatchlist = (instr: FnoInstrument) => {
    if (watchlistTokens.has(instr.token)) {
      dispatch(removeFromWatchlist(instr.token));
      showToast('Removed from watchlist', 'info');
    } else {
      dispatch(addToWatchlist({
        token: instr.token, symbol: instr.symbol,
        tradingSymbol: instr.tradingSymbol, exchange: instr.exchange,
        instrumentType: instr.instrumentType, optionType: instr.optionType,
        expiry: instr.expiry, strikePrice: instr.strikePrice, lotSize: instr.lotSize,
      }));
      showToast('Added to watchlist', 'success');
    }
  };

  const openOrder = (instr: FnoInstrument | WatchlistEntry, dir: 'BUY' | 'SELL') => {
    setSelectedInstr(instr);
    setDirection(dir);
    setOrderPanelOpen(true);
    setOrderForm(p => ({ ...p, quantity: instr.lotSize || '1', price: '0' }));
    if (clientCode) {
      dispatch(fetchWatchlistLtp({ clientCode, symbols: [{
        token: instr.token, symbol: instr.symbol,
        tradingSymbol: instr.tradingSymbol, exchange: instr.exchange,
        instrumentType: instr.instrumentType, optionType: instr.optionType,
        expiry: instr.expiry, strikePrice: instr.strikePrice, lotSize: instr.lotSize,
      }]}));
    }
  };

  const closeOrder = () => { setOrderPanelOpen(false); setSelectedInstr(null); setClientSearch(''); setPanelClients([]); };
  const toggleClient = (key: string) => setPanelClients(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);

  const handlePlaceOrder = async () => {
    if (!loggedInClientCode || !selectedInstr) { showToast('No client / instrument', 'error'); return; }
    if (!orderForm.quantity || Number(orderForm.quantity) < 1) { showToast('Enter valid quantity', 'error'); return; }
    if (!panelClients.length) { showToast('Select at least one account', 'error'); return; }

    const payload = {
      clientcode: loggedInClientCode, exchange: selectedInstr.exchange,
      symboltoken: Number(selectedInstr.token), buyorsell: direction,
      ordertype: orderForm.ordertype, producttype: orderForm.producttype,
      orderduration: orderForm.duration, price: Number(orderForm.price),
      triggerprice: 0, quantityinlot: Number(orderForm.quantity),
      disclosedquantity: 0, amoorder: 'N', selectedClients: panelClients,
      tradingsymbol: selectedInstr.tradingSymbol, tsym: selectedInstr.tradingSymbol,
      exch: selectedInstr.exchange, prctyp: orderForm.ordertype === 'MARKET' ? 'MKT' : 'LMT',
      prd: orderForm.producttype === 'INTRADAY' ? 'I' : 'C', ret: 'DAY',
      trantype: direction === 'BUY' ? 'B' : 'S',
    };

    setOrderLoading(true);
    try {
      const res  = await fetch(`${TRADE_BASE}/api/trade/place-order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload),
      });
      const data = await res.json();
      const ok   = data.successCount ?? 0;
      const fail = data.failedCount  ?? 0;
      const fe   = Object.values(data.results ?? {}).filter((r: any) => !r.success)[0] as any;

      if (!fail && ok > 0)  { showToast(`✓ Order placed for ${ok} account${ok > 1 ? 's' : ''}`, 'success'); closeOrder(); }
      else if (!ok && fail) { showToast(`✗ ${fe?.clientName ? fe.clientName + ': ' : ''}${fe?.message || data.message || 'Failed'}`, 'error'); }
      else if (ok && fail)  { showToast(`${ok}/${ok + fail} orders placed`, 'info'); }
      else                  { showToast(data.message || 'Submitted', 'info'); }
    } catch (err: any) {
      showToast(`Order failed: ${err.message}`, 'error');
    } finally {
      setOrderLoading(false);
    }
  };

  const setF          = (k: string, v: string) => setOrderForm(p => ({ ...p, [k]: v }));
  const selectedQuote = selectedInstr ? quoteMap[selectedInstr.token] : null;
  const lastRefFmt    = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const renderRow = (instr: FnoInstrument | WatchlistEntry, isWatchlistView: boolean) => {
    const q    = quoteMap[instr.token];
    const inWl = watchlistTokens.has(instr.token);
    return (
      <tr key={instr.token} className={`fno-table__row ${q ? q.changePct > 0 ? 'fno-table__row--up' : q.changePct < 0 ? 'fno-table__row--down' : '' : ''}`}>
        <td>
          <div className="fno-sym">
            <span className="fno-sym__name">{instr.symbol || '—'}</span>
            <span className="fno-sym__full" title={instr.tradingSymbol}>{instr.tradingSymbol}</span>
            <span className="fno-sym__exch">{instr.exchange}</span>
          </div>
        </td>
        <td><TypeBadge optionType={instr.optionType} instrumentType={instr.instrumentType} /></td>
        {/* ✅ Fixed: fmtExpiry converts Unix timestamp to readable date */}
        <td className="fno-muted hide-sm">{fmtExpiry(instr.expiry)}</td>
        <td className="right hide-sm">
          {instr.strikePrice && instr.strikePrice !== '0'
            ? <span className="fno-muted">₹{parseFloat(instr.strikePrice).toLocaleString('en-IN')}</span>
            : <span className="fno-na">—</span>}
        </td>
        <td className="right hide-sm"><span className="fno-muted">{instr.lotSize || '—'}</span></td>
        <td className="right">
          {quotesLoading && selectedInstr?.token === instr.token
            ? <span className="fno-skeleton" />
            : q
              ? <span className={`fno-ltp ${q.changePct > 0 ? 'fno-ltp--up' : q.changePct < 0 ? 'fno-ltp--down' : ''}`}>₹{fmt(q.ltp)}</span>
              : <span className="fno-na">—</span>}
        </td>
        <td className="right">{q ? <ChangeChip change={q.change} pct={q.changePct} /> : <span className="fno-na">—</span>}</td>
        {isWatchlistView && (
          <td className="hide-sm">{q ? <MiniSparkBar open={q.open} low={q.low} high={q.high} ltp={q.ltp} /> : <span className="fno-na">—</span>}</td>
        )}
        {isWatchlistView && (
          <td className="right hide-sm">{q ? <span className="fno-muted">{fmtVol(q.volume)}</span> : <span className="fno-na">—</span>}</td>
        )}
        <td>
          <div className="fno-action-btns">
            <button className="fno-action-btn fno-action-btn--buy"  onClick={() => openOrder(instr, 'BUY')}><TrendingUp size={10} /> B</button>
            <button className="fno-action-btn fno-action-btn--sell" onClick={() => openOrder(instr, 'SELL')}><TrendingDown size={10} /> S</button>
            {isWatchlistView
              ? <button className="fno-action-btn fno-action-btn--remove" onClick={() => dispatch(removeFromWatchlist(instr.token))} title="Remove"><X size={11} /></button>
              : <button className={`fno-star-btn ${inWl ? 'fno-star-btn--active' : ''}`} onClick={() => toggleWatchlist(instr as FnoInstrument)} title={inWl ? 'Remove' : 'Add to watchlist'}>
                  {inWl ? <Star size={13} fill="currentColor" /> : <Star size={13} />}
                </button>
            }
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="fno-page">

      {/* Header */}
      <div className="fno-page__header">
        <div className="fno-page__header-left">
          <div className="fno-page__title-row">
            <LineChart size={20} className="fno-page__title-icon" />
            <h2 className="fno-page__title">F&amp;O Instruments</h2>
            {instrumentsLoading && <Loader2 size={14} className="fno-page__spin" />}
          </div>
          {instruments.length > 0 && activeView === 'instruments' && (
            <span className="fno-page__subtitle">
              {filteredInstruments.length.toLocaleString()} of {instruments.length.toLocaleString()} shown
            </span>
          )}
          {activeView === 'watchlist' && lastRefFmt && (
            <span className="fno-page__subtitle">Updated {lastRefFmt}</span>
          )}
        </div>
        <div className="fno-page__header-actions">
          <div className="fno-view-toggle">
            <button className={`fno-view-toggle__btn ${activeView === 'instruments' ? 'active' : ''}`} onClick={() => dispatch(setActiveView('instruments'))}>
              <BarChart2 size={13} /> All Instruments
            </button>
            <button className={`fno-view-toggle__btn ${activeView === 'watchlist' ? 'active' : ''}`} onClick={() => dispatch(setActiveView('watchlist'))}>
              <Star size={13} /> Watchlist
              {watchlist.length > 0 && <span className="fno-view-toggle__count">{watchlist.length}</span>}
            </button>
          </div>
          {activeView === 'instruments' && (
            <div className="fno-select-wrap">
              <select className="fno-select" value={selectedExchange} onChange={e => dispatch(setSelectedExchange(e.target.value))}>
                {EXCHANGES.map(ex => <option key={ex}>{ex}</option>)}
              </select>
              <ChevronDown size={12} className="fno-select-wrap__arrow" />
            </div>
          )}
          {activeView === 'watchlist' && watchlist.length > 0 && (
            <button className="fno-btn fno-btn--ghost" onClick={refreshWatchlistLtp} disabled={quotesLoading}>
              <RefreshCw size={13} className={quotesLoading ? 'spin' : ''} /><span>Refresh</span>
            </button>
          )}
          {activeView === 'watchlist' && watchlist.length > 0 && (
            <button className="fno-btn fno-btn--danger-ghost" onClick={() => { if (window.confirm('Clear entire watchlist?')) dispatch(clearWatchlist()); }}>
              <Trash2 size={13} /> <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {instrumentsError && <div className="fno-error"><AlertCircle size={14} /><span>Error: {instrumentsError}</span></div>}
      {quotesError && activeView === 'watchlist' && <div className="fno-error"><AlertCircle size={14} /><span>Quote error: {quotesError}</span></div>}

      {/* Search */}
      <div className="fno-search-bar">
        <Search size={13} className="fno-search-bar__icon" />
        <input
          type="text"
          placeholder={activeView === 'instruments' ? `Search symbol or name… (${instruments.length.toLocaleString()} total)` : 'Filter watchlist…'}
          value={searchQuery}
          onChange={e => dispatch(setSearchQuery(e.target.value))}
          className="fno-search-bar__input"
        />
        {searchQuery && <button className="fno-search-bar__clear" onClick={() => dispatch(setSearchQuery(''))}><X size={11} /></button>}
      </div>

      {/* Type tabs */}
      <div className="fno-tabs">
        {INST_TYPES.map(t => (
          <button key={t} className={`fno-tab ${selectedType === t ? 'fno-tab--active' : ''}`} onClick={() => dispatch(setSelectedType(t))}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ═══ INSTRUMENTS VIEW ═══ */}
      {activeView === 'instruments' && (
        <>
          {instrumentsLoading ? (
            <div className="fno-empty"><Loader2 size={30} className="fno-page__spin" /><p className="fno-empty__sub">Loading {selectedExchange}…</p></div>
          ) : instruments.length === 0 ? (
            <div className="fno-empty">
              <div className="fno-empty__icon"><BarChart2 size={36} /></div>
              <p className="fno-empty__title">No instruments loaded</p>
              <p className="fno-empty__sub">Select an exchange to load F&amp;O instruments</p>
            </div>
          ) : (
            <div className="fno-table-wrap">
              <table className="fno-table">
                <thead>
                  <tr>
                    <th>Symbol / Name</th><th>Type</th>
                    <th className="hide-sm">Expiry</th>
                    <th className="right hide-sm">Strike</th>
                    <th className="right hide-sm">Lot</th>
                    <th className="right">LTP</th>
                    <th className="right">Change</th>
                    <th className="center">Action</th>
                  </tr>
                </thead>
                <tbody>{pagedInstruments.map(i => renderRow(i, false))}</tbody>
              </table>
              {pagedInstruments.length === 0 && (
                <div className="fno-empty fno-empty--inline">
                  <Eye size={20} />
                  <p>No instruments match{searchQuery ? ` "${searchQuery}"` : ''}{selectedType !== 'ALL' ? ` in "${TYPE_LABELS[selectedType]}"` : ''}</p>
                </div>
              )}
              <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
            </div>
          )}
        </>
      )}

      {/* ═══ WATCHLIST VIEW ═══ */}
      {activeView === 'watchlist' && (
        <>
          {watchlist.length === 0 ? (
            <div className="fno-empty">
              <div className="fno-empty__icon"><Star size={36} /></div>
              <p className="fno-empty__title">Watchlist is empty</p>
              <p className="fno-empty__sub">Go to <strong>All Instruments</strong> and click the <Star size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> star</p>
              <button className="fno-btn fno-btn--primary" onClick={() => dispatch(setActiveView('instruments'))}><BarChart2 size={13} /> Browse Instruments</button>
            </div>
          ) : (
            <div className="fno-table-wrap">
              <div className="fno-wl-summary">
                <div className="fno-wl-summary__item"><span>Watching</span><strong>{watchlist.length}</strong></div>
                {quotes.length > 0 && (<>
                  <div className="fno-wl-summary__sep" />
                  <div className="fno-wl-summary__item fno-wl-summary__item--green"><TrendingUp size={12} /><span>Gainers</span><strong>{quotes.filter(q => q.changePct > 0).length}</strong></div>
                  <div className="fno-wl-summary__sep" />
                  <div className="fno-wl-summary__item fno-wl-summary__item--red"><TrendingDown size={12} /><span>Losers</span><strong>{quotes.filter(q => q.changePct < 0).length}</strong></div>
                </>)}
              </div>
              <table className="fno-table">
                <thead>
                  <tr>
                    <th>Symbol / Name</th><th>Type</th>
                    <th className="hide-sm">Expiry</th>
                    <th className="right hide-sm">Strike</th>
                    <th className="right hide-sm">Lot</th>
                    <th className="right">LTP</th>
                    <th className="right">Change</th>
                    <th className="hide-sm">Day Range</th>
                    <th className="right hide-sm">Volume</th>
                    <th className="center">Action</th>
                  </tr>
                </thead>
                <tbody>{filteredWatchlist.map(w => renderRow(w, true))}</tbody>
              </table>
              {filteredWatchlist.length === 0 && (searchQuery || selectedType !== 'ALL') && (
                <div className="fno-empty fno-empty--inline"><Eye size={20} /><p>No watchlist items match{searchQuery ? ` "${searchQuery}"` : ''}</p></div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ ORDER PANEL ═══ */}
      {orderPanelOpen && selectedInstr && (
        <div className="fno-panel-overlay" onClick={closeOrder}>
          <div className="fno-order-panel" onClick={e => e.stopPropagation()}>
            <div className="fno-order-panel__head">
              <div>
                <div className="fno-order-panel__sym">{selectedInstr.symbol}</div>
                <div className="fno-order-panel__sym-full">{selectedInstr.tradingSymbol}</div>
                <div className="fno-order-panel__meta">
                  {selectedInstr.exchange}
                  {selectedInstr.expiry ? ` · Exp ${fmtExpiry(selectedInstr.expiry)}` : ''}
                  {selectedInstr.strikePrice && selectedInstr.strikePrice !== '0' ? ` · Strike ₹${parseFloat(selectedInstr.strikePrice).toLocaleString('en-IN')}` : ''}
                  {` · Lot ${selectedInstr.lotSize}`}
                </div>
              </div>
              <button className="fno-panel__close" onClick={closeOrder}><X size={16} /></button>
            </div>

            {quotesLoading && !selectedQuote && (
              <div className="fno-order-panel__ltp-loading"><Loader2 size={12} className="spin" /> Fetching live quote…</div>
            )}
            {selectedQuote && (
              <div className={`fno-order-panel__ltp-strip ${selectedQuote.changePct >= 0 ? 'up' : 'down'}`}>
                <span className="fno-order-panel__ltp-val">₹{fmt(selectedQuote.ltp)}</span>
                <ChangeChip change={selectedQuote.change} pct={selectedQuote.changePct} />
                <span className="fno-order-panel__ltp-hl">H:₹{fmt(selectedQuote.high, 0)} &nbsp; L:₹{fmt(selectedQuote.low, 0)} &nbsp;|&nbsp; OI: {fmtVol(selectedQuote.oi)}</span>
              </div>
            )}

            <div className="fno-order-panel__direction">
              <button className={`fno-dir-btn fno-dir-btn--buy ${direction === 'BUY' ? 'active' : ''}`} onClick={() => setDirection('BUY')}><TrendingUp size={14} /> BUY</button>
              <button className={`fno-dir-btn fno-dir-btn--sell ${direction === 'SELL' ? 'active' : ''}`} onClick={() => setDirection('SELL')}><TrendingDown size={14} /> SELL</button>
            </div>

            <div className="fno-order-panel__body">
              <div className="fno-order-form">
                <div className="fno-form-row">
                  <div className="fno-form-group">
                    <label>Order Type</label>
                    <select value={orderForm.ordertype} onChange={e => setF('ordertype', e.target.value)}>
                      <option value="MARKET">MARKET</option><option value="LIMIT">LIMIT</option>
                      <option value="SL">SL</option><option value="SL-M">SL-M</option>
                    </select>
                  </div>
                  <div className="fno-form-group">
                    <label>Product</label>
                    <select value={orderForm.producttype} onChange={e => setF('producttype', e.target.value)}>
                      <option value="CARRYFORWARD">NRML</option><option value="INTRADAY">MIS</option><option value="DELIVERY">CNC</option>
                    </select>
                  </div>
                </div>
                <div className="fno-form-row">
                  <div className="fno-form-group">
                    <label>Quantity (Lots) *</label>
                    <input type="number" min="1" value={orderForm.quantity} onChange={e => setF('quantity', e.target.value)} placeholder="No. of lots" />
                  </div>
                  <div className="fno-form-group">
                    <label>Price</label>
                    <input type="number" min="0" value={orderForm.price} onChange={e => setF('price', e.target.value)} placeholder="0 = Market" />
                  </div>
                </div>
                <div className="fno-order-summary">
                  {([
                    ['Direction', <span className={`fno-order-summary__dir fno-order-summary__dir--${direction.toLowerCase()}`}>{direction}</span>],
                    ['Product',   orderForm.producttype],
                    ['Accounts',  <span className={panelClients.length === 0 ? 'fno-order-summary__warn' : ''}>{panelClients.length} selected</span>],
                  ] as [string, React.ReactNode][]).map(([k, v], i) => (
                    <div key={i} className="fno-order-summary__row"><span>{k}</span><span>{v}</span></div>
                  ))}
                </div>
              </div>

              <div className="fno-client-section">
                <div className="fno-client-section__head">
                  <span className="fno-client-section__title">Select Accounts</span>
                  <button className="fno-client-section__selall" onClick={() => setPanelClients(allAccSelected ? [] : brokerAccounts.map(a => a.selectionKey))}>
                    {allAccSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="fno-client-search">
                  <Search size={11} />
                  <input type="text" placeholder="Search account…" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                  {clientSearch && <button onClick={() => setClientSearch('')}><X size={10} /></button>}
                </div>
                <div className="fno-client-list">
                  {filteredBrokerAccounts.length === 0 && <div className="fno-client-empty">No accounts found</div>}
                  {filteredBrokerAccounts.map(acc => {
                    const sel = panelClients.includes(acc.selectionKey);
                    return (
                      <div key={acc.selectionKey} className={`fno-client-item ${sel ? 'fno-client-item--selected' : ''} ${acc.isMaster ? 'fno-client-item--master' : ''}`} onClick={() => toggleClient(acc.selectionKey)}>
                        <div className="fno-client-item__check">{sel ? <CheckSquare size={14} className="checked" /> : <Square size={14} />}</div>
                        <div className="fno-client-item__avatar">{acc.brokerName.slice(0, 2).toUpperCase()}</div>
                        <div className="fno-client-item__info"><strong>{acc.clientName}</strong><span>{acc.userId}</span></div>
                        <div className="fno-client-item__right">
                          <span className="fno-client-item__broker">{acc.isMaster ? '★ ' : ''}{acc.brokerName}</span>
                          <span className={`fno-client-item__auth fno-client-item__auth--${acc.isAuthenticated ? 'ok' : 'pending'}`}>{acc.isAuthenticated ? '● Auth' : '○ Pending'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="fno-client-footer"><span><strong>{panelClients.length}</strong> of <strong>{brokerAccounts.length}</strong> selected</span></div>
              </div>
            </div>

            <div className="fno-order-panel__footer">
              <button
                className={`fno-place-btn fno-place-btn--${direction.toLowerCase()} ${orderLoading ? 'loading' : ''}`}
                disabled={!panelClients.length || !loggedInClientCode || orderLoading || !orderForm.quantity}
                onClick={handlePlaceOrder}
              >
                {orderLoading
                  ? <><Loader2 size={13} className="spin" /> Placing…</>
                  : direction === 'BUY'
                    ? <><TrendingUp size={13} /> BUY · {selectedInstr.symbol} · {panelClients.length} Account{panelClients.length !== 1 ? 's' : ''}</>
                    : <><TrendingDown size={13} /> SELL · {selectedInstr.symbol} · {panelClients.length} Account{panelClients.length !== 1 ? 's' : ''}</>}
              </button>
              {!panelClients.length && <p className="fno-order-panel__footer-hint">Select at least one account above</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};