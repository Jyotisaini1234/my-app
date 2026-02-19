import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, X, Search, Loader2 } from 'lucide-react';

import './BulkTradingPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedClients, placeOrderForAll, toggleSelectedClient, clearResult } from '../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { fetchActiveClients } from '../../store/slice/clientsSlice/clientsSlice';
import { Badge } from '../../components/common/Badge/Badge';
import { Button } from '../../components/common/Button/Button';
import { FormGroup } from '../../components/common/FormGroup/FormGroup';
import { brokerService } from '../../services/clientService';

// ─── Symbol Search Types ──────────────────────────────────────────────────────
interface SymbolSuggestion {
  exchange: string;
  scripcode: number;
  scripfullname: string;
  scripshortname: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

// ─── Symbol Search Dropdown Component ────────────────────────────────────────
interface SymbolSearchProps {
  exchange: string;
  masterClientCode: string;
  onSelect: (symbol: string, token: string) => void;
  initialSymbol?: string;
}

const SymbolSearch: React.FC<SymbolSearchProps> = ({ exchange, masterClientCode, onSelect, initialSymbol }) => {
  const [query, setQuery] = useState(initialSymbol || '');
  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (!masterClientCode) return;

    setLoading(true);
    try {
      const res = await brokerService.searchSymbols(masterClientCode, exchange, q);
      // Handle both {data: [...]} and direct array responses
      const list: SymbolSuggestion[] = Array.isArray(res)
        ? res
        : (res as any)?.data ?? [];
      setSuggestions(list.slice(0, 10));
      setOpen(list.length > 0);
    } catch (err) {
      console.error('Symbol search error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [exchange, masterClientCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    setSelected(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (item: SymbolSuggestion) => {
    const symbolName = item.scripshortname || item.scripfullname;
    const token = String(item.scripcode);
    setQuery(symbolName);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    onSelect(symbolName, token);
  };

  const handleClear = () => {
    setQuery('');
    setSelected(false);
    setSuggestions([]);
    setOpen(false);
    onSelect('', '');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Search icon */}
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'rgba(255,255,255,0.35)', pointerEvents: 'none', display: 'flex'
        }}>
          {loading
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Search size={14} />
          }
        </span>

        <input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search symbol e.g. NIFTY, RELIANCE"
          style={{ paddingLeft: 32, paddingRight: selected ? 32 : 10 }}
        />

        {/* Clear button when selected */}
        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', display: 'flex', padding: 2,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxHeight: 280, overflowY: 'auto', marginTop: 4,
        }}>
          {suggestions.map((item, idx) => (
            <div
              key={`${item.scripcode}-${idx}`}
              onClick={() => handleSelect(item)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {item.scripshortname}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.scripfullname}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 600,
                }}>
                  {item.exchange}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  Token: {item.scripcode}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {open && !loading && suggestions.length === 0 && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '12px 14px', marginTop: 4,
          fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center',
        }}>
          No symbols found for "{query}"
        </div>
      )}
    </div>
  );
};


// ─── Main BulkTradingPage ─────────────────────────────────────────────────────

export const BulkTradingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: clients } = useAppSelector((s) => s.clients);
  const { loading, lastResult, selectedClients } = useAppSelector((s) => s.bulkTrade);

  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [form, setForm] = useState({
    tradingsymbol: '',
    symboltoken:   '',
    exchange:      'NSE',
    ordertype:     'MARKET',
    producttype:   'INTRADAY',   // ← Fixed: was 'MIS', broker expects 'INTRADAY'
    duration:      'DAY',
    price:         '0',
    quantity:      '',
  });

  useEffect(() => {
    dispatch(fetchActiveClients());
  }, [dispatch]);

  const activeClients = Object.values(clients).filter((c) => c.is_active);
  const masterClient  = activeClients.find((c) => c.is_master);
  const allSelected   = activeClients.length > 0 && selectedClients.length === activeClients.length;

  const handleSelectAll = () => {
    if (allSelected) {
      dispatch(setSelectedClients([]));
    } else {
      dispatch(setSelectedClients(activeClients.map((c) => c.client_code)));
    }
  };

  // Called when user selects a symbol from dropdown
  const handleSymbolSelect = (symbol: string, token: string) => {
    setForm(prev => ({ ...prev, tradingsymbol: symbol, symboltoken: token }));
  };

  const handlePlaceOrder = () => {
    if (!masterClient)      { alert('No master client found'); return; }
    if (!form.symboltoken)  { alert('Symbol Token is required — please search and select a symbol'); return; }
    if (!form.quantity)     { alert('Quantity is required'); return; }
    if (selectedClients.length === 0) { alert('Please select at least one client'); return; }

    dispatch(placeOrderForAll({
      clientcode:    masterClient.client_code,
      exchange:      form.exchange,
      symboltoken:   form.symboltoken,
      buyorsell:     direction,
      ordertype:     form.ordertype,
      producttype:   form.producttype,
      duration:      form.duration,
      price:         form.price,
      quantity:      form.quantity,
      selectedClients: selectedClients,

      // TypeScript required fields
      variety:        'NORMAL',
      tradingsymbol:  form.tradingsymbol,
      transactiontype: direction,
      squareoff:      '0',
      stoploss:       '0',
    } as any));
  };

  const setF = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="bulk-trading">
      {/* LEFT COLUMN */}
      <div className="bulk-trading__left">
        <div className="card">
          <div className="card__head">
            <div>
              <h3>Client Selection</h3>
              <p>Select clients to include in bulk trade</p>
            </div>
            <Badge color={selectedClients.length > 0 ? 'success' : 'default'}>
              {selectedClients.length} selected
            </Badge>
          </div>
          <div className="card__body">
            <div className="client-selection">
              <div className="client-selection__list">
                {activeClients.map((client) => {
                  const isSelected = selectedClients.includes(client.client_code);
                  return (
                    <div
                      key={client.client_code}
                      className={[
                        'client-selection__item',
                        isSelected ? 'client-selection__item--selected' : '',
                        client.is_master ? 'client-selection__item--master' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => dispatch(toggleSelectedClient(client.client_code))}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => dispatch(toggleSelectedClient(client.client_code))}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="client-selection__item-icon">
                        {client.client_code.slice(0, 2)}
                      </div>
                      <div className="client-selection__item-info">
                        <strong>{client.client_code}</strong>
                        <span>{client.user_id}</span>
                      </div>
                      <span className="client-selection__item-broker">
                        {client.is_master ? '★ Master' : 'Motilal'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="client-selection__footer">
                <span>
                  <strong>{selectedClients.length}</strong> of{' '}
                  <strong>{activeClients.length}</strong> selected
                </span>
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Result */}
        {lastResult && (
          <div className="trade-result">
            <div className="trade-result__header">
              <h4>Trade Results — {lastResult.masterClientCode}</h4>
              <div className="summary-chips">
                <span className="chip chip--success">✓ {lastResult.successCount} OK</span>
                {lastResult.failedCount > 0 && (
                  <span className="chip chip--error">✗ {lastResult.failedCount} Failed</span>
                )}
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                onClick={() => dispatch(clearResult())}
              >
                <X size={16} />
              </button>
            </div>
            <div className="trade-result__list">
              {Object.entries(lastResult.results).map(([code, res]) => (
                <div key={code} className="trade-result__row">
                  <div className="trade-result__row-left">
                    <strong>{code}</strong>
                    <span>{res.message}</span>
                  </div>
                  <div className="trade-result__row-right">
                    {res.status === 'SUCCESS' ? (
                      <CheckCircle size={16} color="#10b981" />
                    ) : (
                      <XCircle size={16} color="#ef4444" />
                    )}
                    {res.uniqueOrderId && (
                      <span className="order-id">{res.uniqueOrderId}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="bulk-trading__right">
        <div className="card">
          <div className="card__head">
            <div>
              <h3>Place Bulk Trade</h3>
              <p>Execute across {selectedClients.length || 0} clients</p>
            </div>
          </div>
          <div className="card__body">
            <div className="order-form">
              {/* BUY / SELL */}
              <div className="order-form__direction">
                <button
                  className={`btn-direction btn-direction--buy ${direction === 'BUY' ? 'btn-direction--buy--active' : ''}`}
                  onClick={() => setDirection('BUY')}
                >
                  <TrendingUp size={16} /> BUY
                </button>
                <button
                  className={`btn-direction btn-direction--sell ${direction === 'SELL' ? 'btn-direction--sell-active' : ''}`}
                  onClick={() => setDirection('SELL')}
                >
                  <TrendingDown size={16} /> SELL
                </button>
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <FormGroup label="Exchange">
                  <select value={form.exchange} onChange={(e) => setF('exchange', e.target.value)}>
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NFO">NFO</option>
                    <option value="MCX">MCX</option>
                  </select>
                </FormGroup>
              </div>

              <FormGroup label="Search Symbol *">
                {masterClient ? (
                  <SymbolSearch
                    exchange={form.exchange}
                    masterClientCode={masterClient.client_code}
                    onSelect={handleSymbolSelect}
                    initialSymbol={form.tradingsymbol}
                  />
                ) : (
                  <input disabled placeholder="No master client — cannot search" />
                )}
              </FormGroup>

              {/* Show selected token as read-only info */}
              {form.symboltoken && (
                <div style={{
                  display: 'flex', gap: 12, marginBottom: 12, padding: '8px 12px',
                  background: 'rgba(16,185,129,0.08)', borderRadius: 8,
                  border: '1px solid rgba(16,185,129,0.2)', fontSize: 12,
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Selected:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{form.tradingsymbol}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>Token: {form.symboltoken}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{form.exchange}</span>
                </div>
              )}

              <div className="form-row">
                <FormGroup label="Order Type">
                  <select value={form.ordertype} onChange={(e) => setF('ordertype', e.target.value)}>
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="SL">SL</option>
                    <option value="SL-M">SL-M</option>
                  </select>
                </FormGroup>
                <FormGroup label="Product">
                  <select value={form.producttype} onChange={(e) => setF('producttype', e.target.value)}>
                    <option value="INTRADAY">INTRADAY (MIS)</option>
                    <option value="DELIVERY">DELIVERY (CNC)</option>
                    <option value="CARRYFORWARD">CARRYFORWARD (NRML)</option>
                  </select>
                </FormGroup>
              </div>

              <div className="form-row">
                <FormGroup label="Quantity *">
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setF('quantity', e.target.value)}
                    placeholder="Qty"
                    min="1"
                  />
                </FormGroup>
                <FormGroup label="Price">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setF('price', e.target.value)}
                    placeholder="0 = Market"
                    min="0"
                  />
                </FormGroup>
              </div>

              {/* Summary */}
              <div className="order-form__summary">
                <div className="order-form__summary-row">
                  <span>Symbol</span>
                  <span>{form.tradingsymbol || '—'}</span>
                </div>
                <div className="order-form__summary-row">
                  <span>Token</span>
                  <span>{form.symboltoken || '—'}</span>
                </div>
                <div className="order-form__summary-row">
                  <span>Direction</span>
                  <span style={{ color: direction === 'BUY' ? '#10b981' : '#ef4444' }}>
                    {direction}
                  </span>
                </div>
                <div className="order-form__summary-row">
                  <span>Product</span>
                  <span>{form.producttype}</span>
                </div>
                <div className="order-form__summary-row">
                  <span>Clients</span>
                  <span>{selectedClients.length}</span>
                </div>
              </div>

              <div className="order-form__actions">
                <Button
                  variant="accent"
                  fullWidth
                  loading={loading}
                  disabled={selectedClients.length === 0 || !masterClient || !form.symboltoken}
                  onClick={handlePlaceOrder}
                  icon={direction === 'BUY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                >
                  Execute {direction} for {selectedClients.length} Clients
                </Button>
                {!masterClient && (
                  <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>
                    No master client found. Please mark one client as master.
                  </p>
                )}
                {masterClient && !form.symboltoken && (
                  <p style={{ fontSize: 12, color: '#f59e0b', textAlign: 'center' }}>
                    Please search and select a symbol above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};