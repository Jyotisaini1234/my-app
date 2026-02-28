import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, X, Search, Loader2 } from 'lucide-react';
import './BulkTradingPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedClients, placeOrderForAll, toggleSelectedClient, clearResult } from '../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { fetchActiveClients } from '../../store/slice/clientsSlice/clientsSlice';
import { Badge } from '../../components/common/Badge/Badge';
import { Button } from '../../components/common/Button/Button';
import { FormGroup } from '../../components/common/FormGroup/FormGroup';
import { brokerService } from '../../services/api';
import { useToast } from '../../context/Toastcontext';

interface SymbolSuggestion {
  exchange: string;
  scripcode: number;
  scripfullname: string;
  scripshortname: string;
}

interface SymbolSearchProps {
  exchange: string;
  masterClientCode: string;
  onSelect: (symbol: string, token: string) => void;
  initialSymbol?: string;
}

const SymbolSearch: React.FC<SymbolSearchProps> = ({ exchange, masterClientCode, onSelect, initialSymbol }) => {
  const [query,       setQuery]       = useState(initialSymbol || '');
  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    if (!masterClientCode) return;
    setLoading(true);
    try {
      const res = await brokerService.searchSymbols(masterClientCode, exchange, q);
      const list: SymbolSuggestion[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (item: SymbolSuggestion) => {
    const symbolName = item.scripshortname || item.scripfullname;
    setQuery(symbolName);
    setOpen(false);
    setSuggestions([]);
    onSelect(symbolName, String(item.scripcode));
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onSelect('', '');
  };

  return (
    <div ref={wrapperRef} className="symbol-search">
      <div className="symbol-search__input-wrap">
        <span className="symbol-search__icon">
          {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
        </span>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search symbol e.g. NIFTY, RELIANCE"
          className={query ? 'has-clear' : ''}
        />
        {query && (
          <button className="symbol-search__clear" onClick={handleClear}>
            <X size={12} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="symbol-search__dropdown">
          {suggestions.map((item, idx) => (
            <div key={`${item.scripcode}-${idx}`} className="symbol-search__item" onClick={() => handleSelect(item)}>
              <div className="symbol-search__item-left">
                <span className="symbol-search__item-name">{item.scripshortname}</span>
                <span className="symbol-search__item-fullname">{item.scripfullname}</span>
              </div>
              <div className="symbol-search__item-right">
                <span className="symbol-search__item-exchange">{item.exchange}</span>
                <span className="symbol-search__item-token">Token: {item.scripcode}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && !loading && suggestions.length === 0 && query.length >= 2 && (
        <div className="symbol-search__empty">No symbols found for "{query}"</div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const BulkTradingPage: React.FC = () => {
  const dispatch      = useAppDispatch();
  const { showToast } = useToast();

  const { data: clients, isFetched: clientsFetched } = useAppSelector(s => s.clients);
  const { loading, lastResult, selectedClients }      = useAppSelector(s => s.bulkTrade);

  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [form, setForm] = useState({
    tradingsymbol: '',
    symboltoken:   '',
    exchange:      'NSE',
    ordertype:     'MARKET',
    producttype:   'INTRADAY',
    duration:      'DAY',
    price:         '0',
    quantity:      '',
  });

  // ✅ Sirf tab fetch karo jab data nahi hai
  useEffect(() => {
    if (!clientsFetched) dispatch(fetchActiveClients());
  }, [clientsFetched, dispatch]);

  // ✅ Order result toast — success / partial / fail
  useEffect(() => {
    if (!lastResult) return;

    const results   = (lastResult as any).results ?? [];
    const total     = results.length;
    const succeeded = results.filter((r: any) => r.status === 'success').length;
    const failed    = total - succeeded;

    if (total === 0) {
      showToast('Order submitted', 'success');
    } else if (failed === 0) {
      showToast(`✓ Order placed for all ${succeeded} client${succeeded > 1 ? 's' : ''}`, 'success');
    } else if (succeeded === 0) {
      showToast(`✗ Order failed for all ${total} client${total > 1 ? 's' : ''}`, 'error');
    } else {
      showToast(`Order placed for ${succeeded}/${total} clients. ${failed} failed.`, 'info');
    }

    // Clear result after showing toast so it doesn't re-show on re-render
    dispatch(clearResult());
  }, [lastResult]);

  const activeClients = Object.values(clients).filter(c => c.is_active);
  const masterClient  = activeClients.find(c => c.is_master);
  const allSelected   = activeClients.length > 0 && selectedClients.length === activeClients.length;

  const handleSelectAll = () => {
    dispatch(setSelectedClients(allSelected ? [] : activeClients.map(c => c.client_code)));
  };

  const handleSymbolSelect = (symbol: string, token: string) => {
    setForm(prev => ({ ...prev, tradingsymbol: symbol, symboltoken: token }));
  };

  const setF = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  // ✅ Validation with toast — no alert()
  const handlePlaceOrder = async () => {
    if (!masterClient) {
      showToast('No master client found. Please mark one client as master.', 'error');
      return;
    }
    if (!form.symboltoken) {
      showToast('Please search and select a symbol first', 'error');
      return;
    }
    if (!form.quantity || Number(form.quantity) < 1) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }
    if (selectedClients.length === 0) {
      showToast('Please select at least one client', 'error');
      return;
    }

    await dispatch(placeOrderForAll({
      clientcode:      masterClient.client_code,
      exchange:        form.exchange,
      symboltoken:     form.symboltoken,
      buyorsell:       direction,
      ordertype:       form.ordertype,
      producttype:     form.producttype,
      duration:        form.duration,
      price:           form.price,
      quantity:        form.quantity,
      selectedClients: selectedClients,
      variety:         'NORMAL',
      tradingsymbol:   form.tradingsymbol,
      transactiontype: direction,
      squareoff:       '0',
      stoploss:        '0',
    } as any));
    // toast is handled by the useEffect above via lastResult
  };

  return (
    <div className="bulk-trading">

      {/* ── Order Form ── */}
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

              <div className="form-row">
                <FormGroup label="Exchange">
                  <select value={form.exchange} onChange={e => setF('exchange', e.target.value)}>
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

              {form.symboltoken && (
                <div className="symbol-info">
                  <span className="symbol-info__label">Selected:</span>
                  <span className="symbol-info__name">{form.tradingsymbol}</span>
                  <span className="symbol-info__token">Token: {form.symboltoken}</span>
                  <span className="symbol-info__exchange">{form.exchange}</span>
                </div>
              )}

              <div className="form-row">
                <FormGroup label="Order Type">
                  <select value={form.ordertype} onChange={e => setF('ordertype', e.target.value)}>
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="SL">SL</option>
                    <option value="SL-M">SL-M</option>
                  </select>
                </FormGroup>
                <FormGroup label="Product">
                  <select value={form.producttype} onChange={e => setF('producttype', e.target.value)}>
                    <option value="INTRADAY">INTRADAY (MIS)</option>
                    <option value="DELIVERY">DELIVERY (CNC)</option>
                    <option value="CARRYFORWARD">CARRYFORWARD (NRML)</option>
                  </select>
                </FormGroup>
              </div>

              <div className="form-row">
                <FormGroup label="Quantity *">
                  <input type="number" value={form.quantity} onChange={e => setF('quantity', e.target.value)} placeholder="Qty" min="1" />
                </FormGroup>
                <FormGroup label="Price">
                  <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0 = Market" min="0" />
                </FormGroup>
              </div>

              <div className="order-form__summary">
                <div className="order-form__summary-row"><span>Symbol</span><span>{form.tradingsymbol || '—'}</span></div>
                <div className="order-form__summary-row"><span>Token</span><span>{form.symboltoken || '—'}</span></div>
                <div className="order-form__summary-row">
                  <span>Direction</span>
                  <span className={`order-form__summary-direction--${direction === 'BUY' ? 'buy' : 'sell'}`}>{direction}</span>
                </div>
                <div className="order-form__summary-row"><span>Product</span><span>{form.producttype}</span></div>
                <div className="order-form__summary-row"><span>Clients</span><span>{selectedClients.length}</span></div>
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
                  <p className="order-form__hint order-form__hint--error">
                    No master client found. Please mark one client as master.
                  </p>
                )}
                {masterClient && !form.symboltoken && (
                  <p className="order-form__hint order-form__hint--warning">
                    Please search and select a symbol above.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Client Selection ── */}
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
                {activeClients.map(client => {
                  const isSelected = selectedClients.includes(client.client_code);
                  return (
                    <div
                      key={client.client_code}
                      className={['client-selection__item', isSelected ? 'client-selection__item--selected' : '', client.is_master ? 'client-selection__item--master' : ''].filter(Boolean).join(' ')}
                      onClick={() => dispatch(toggleSelectedClient(client.client_code))}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => dispatch(toggleSelectedClient(client.client_code))}
                        onClick={e => e.stopPropagation()}
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
                  <strong>{selectedClients.length}</strong> of <strong>{activeClients.length}</strong> selected
                </span>
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};