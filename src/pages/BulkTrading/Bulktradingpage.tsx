import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, X, Search, Loader2 } from 'lucide-react';
import './BulkTradingPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedClients, toggleSelectedClient, clearResult } from '../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { fetchActiveClients } from '../../store/slice/clientsSlice/clientsSlice';
import { Badge } from '../../components/common/Badge/Badge';
import { Button } from '../../components/common/Button/Button';
import { FormGroup } from '../../components/common/FormGroup/FormGroup';
import { brokerService } from '../../services/api';
import { useToast } from '../../context/ToastContext/Toastcontext';
import { TRADE_BASE } from '../../utils/ApiConstants';
import {  UserInfo } from '../../types/profile';

interface SymbolSuggestion {
  exchange:       string;
  scripcode:      number;
  scripfullname:  string;
  scripshortname: string;
}

interface BrokerAccount {
  clientCode:      string;
  brokerName:      string;
  userId:          string;
  isAuthenticated: boolean;
  isMaster:        boolean;
  isActive:        boolean;
  selectionKey:    string;
}

interface SymbolSearchProps {
  exchange:       string;
  clientCode:     string;
  onSelect:       (symbol: string, token: string) => void;
  initialSymbol?: string;
  user?: UserInfo;
}


const SymbolSearch: React.FC<SymbolSearchProps> = ({exchange, clientCode,onSelect, initialSymbol,user}) => {
  const [query,       setQuery]       = useState(initialSymbol || '');
  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  let displayName = user?.clientCode;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
      if (!clientCode) return;
      setLoading(true);
      try {
        const res  = await brokerService.searchSymbols(clientCode, exchange, q);
        const list: SymbolSuggestion[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
        setSuggestions(list.slice(0, 10));
        setOpen(list.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [exchange, clientCode],
  );

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
            <div
              key={`${item.scripcode}-${idx}`}
              className="symbol-search__item"
              onClick={() => handleSelect(item)}
            >
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

interface userDetails {
  user?: UserInfo;
}

export const BulkTradingPage: React.FC <userDetails>= ({user})=>{
  const dispatch      = useAppDispatch();
  const { showToast } = useToast();
  const { data: clients, isFetched: clientsFetched } = useAppSelector(s => s.clients);
  const { lastResult, selectedClients }              = useAppSelector(s => s.bulkTrade);
  const authUser = useAppSelector(s => s.auth.user);
  const [orderLoading, setOrderLoading] = useState(false);
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [form, setForm] = useState({ tradingsymbol: '',symboltoken:   '',exchange:      'NSE',ordertype:     'MARKET', producttype:   'INTRADAY', duration:      'DAY', price:         '0',quantity:      '',});
  const activeClients      = useMemo(() => Object.values(clients).filter(c => c.is_active), [clients]);
  const loggedInClientCode = authUser?.id || authUser?.clientCode;
  const loggedInAccount = useMemo(() => activeClients.find(c => c.client_code === loggedInClientCode) ?? activeClients[0] ?? null,[activeClients, loggedInClientCode], );

  const brokerAccounts = useMemo((): BrokerAccount[] => {
    const items: BrokerAccount[] = [];
    activeClients.forEach(c => {
      const brokersMap = ((c as any)?.brokers ?? {}) as Record<string, any>;
      const brokerKeys = Object.keys(brokersMap).filter(k => brokersMap[k]?.enabled !== false);

      if (brokerKeys.length === 0) {
        items.push({
          clientCode:      c.client_code,
          brokerName:      'UNKNOWN',
          userId:          c.user_id ?? '—',
          isAuthenticated: (c as any).is_authenticated ?? false,
          isMaster:        c.is_master,
          isActive:        c.is_active,
          selectionKey:    `${c.client_code}:UNKNOWN`,
        });
      } else {
        brokerKeys.forEach(brokerName => {
          const b = brokersMap[brokerName];
          items.push({
            clientCode:      c.client_code,
            brokerName,
            userId:          b?.user_id ?? c.user_id ?? '—',
            isAuthenticated: b?.is_authenticated ?? false,
            isMaster:        c.is_master,
            isActive:        c.is_active,
            selectionKey:    `${c.client_code}:${brokerName}`,
          });
        });
      }
    });
    return items;
  }, [activeClients]);

  const allSelected = brokerAccounts.length > 0 && brokerAccounts.every(a => selectedClients.includes(a.selectionKey));

 
  useEffect(() => {
    if (!clientsFetched) dispatch(fetchActiveClients());
  }, [clientsFetched, dispatch]);

  useEffect(() => {
    if (!lastResult) return;
    dispatch(clearResult());
  }, [lastResult]);

  const getBrokerInitials = (brokerName: string): string =>
    brokerName.slice(0, 2).toUpperCase();

  const setF = (key: string, val: string) =>
    setForm(p => ({ ...p, [key]: val }));

  const handleSymbolSelect = (symbol: string, token: string) =>
    setForm(prev => ({ ...prev, tradingsymbol: symbol, symboltoken: token }));

  const handleSelectAll = () =>
    dispatch(setSelectedClients(allSelected ? [] : brokerAccounts.map(a => a.selectionKey)));

  const handlePlaceOrder = async () => {
    if (!loggedInClientCode) {
      showToast('No active client found. Please add or activate a client.', 'error');
      return;
    }
    if (!form.symboltoken || !form.tradingsymbol) {
      showToast('Please search and select a symbol first', 'error');
      return;
    }
    if (!form.quantity || Number(form.quantity) < 1) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }
    if (selectedClients.length === 0) {
      showToast('Please select at least one account', 'error');
      return;
    }

    const resolvedClients = selectedClients; 
    const shoonyaTsym = form.exchange === 'NSE' && !form.tradingsymbol.toUpperCase().endsWith('-EQ')? `${form.tradingsymbol.toUpperCase()}-EQ` : form.tradingsymbol.toUpperCase();

    const payload = {
      clientcode:        loggedInClientCode,
      exchange:          form.exchange,
      symboltoken:       Number(form.symboltoken),
      buyorsell:         direction,
      ordertype:         form.ordertype,
      producttype:       form.producttype,
      orderduration:     form.duration,
      price:             Number(form.price),
      triggerprice:      0,
      quantityinlot:     Number(form.quantity),
      disclosedquantity: 0,
      amoorder:          'N',
      selectedClients:   resolvedClients,
      tradingsymbol:     form.tradingsymbol,
      tsym:              shoonyaTsym,
      exch:              form.exchange,
      prctyp:            form.ordertype === 'MARKET' ? 'MKT' : 'LMT',
      prd:               form.producttype === 'INTRADAY' ? 'I' : 'C',
      ret:               'DAY',
      trantype:          direction === 'BUY' ? 'B' : 'S',
    };

    setOrderLoading(true);
    try {
      const res  = await fetch(`${TRADE_BASE}/api/trade/place-order`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload),
      });

      const data = await res.json();

      const succeeded     = data.successCount ?? 0;
      const failed        = data.failedCount  ?? 0;
      const total         = succeeded + failed;
      const results: Record<string, any> = data.results ?? {};
      const failedEntries = Object.values(results).filter((r: any) => !r.success || r.status === 'ERROR');

      if (failed === 0 && succeeded > 0) {
        showToast(`✓ Order placed for ${succeeded} account${succeeded > 1 ? 's' : ''}`, 'success');
      } else if (succeeded === 0 && failed > 0) {
        const msg        = failedEntries[0]?.message || data.message || 'Order failed';
        const clientName = failedEntries[0]?.clientName || failedEntries[0]?.clientcode || '';
        showToast(`✗ ${clientName ? clientName + ': ' : ''}${msg}`, 'error');
      } else if (succeeded > 0 && failed > 0) {
        showToast(`${succeeded}/${total} orders placed. Some failed.`, 'info');
      } else {
        showToast(data.message || 'Order submitted', 'info');
      }
    } catch (err: any) {
      showToast(`Order failed: ${err.message}`, 'error');
    } finally {
      setOrderLoading(false);
    }
  };

 let displayName = user?.clientCode;

  return (
    <div className="bulk-trading">

      <div className="bulk-trading__right">
        <div className="card">
          <div className="card__head">
            <div>
              <h3>Place Bulk Trade</h3>
              <p>Execute across {selectedClients.length || 0} account{selectedClients.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="card__body">
            <div className="order-form">

              <div className="order-form__direction">
                <button className={`btn-direction btn-direction--buy ${direction === 'BUY' ? 'btn-direction--buy--active' : ''}`} onClick={() => setDirection('BUY')}>
                  <TrendingUp size={16} /> BUY
                </button>
                <button className={`btn-direction btn-direction--sell ${direction === 'SELL' ? 'btn-direction--sell-active' : ''}`}  onClick={() => setDirection('SELL')}>
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
                {loggedInAccount ? (
                  <SymbolSearch exchange={form.exchange} clientCode={loggedInAccount.client_code} onSelect={handleSymbolSelect}  initialSymbol={form.tradingsymbol} />
                ) : (
                  <input disabled placeholder="No client found — cannot search" />
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
                  <input type="number" value={form.quantity} onChange={e => setF('quantity', e.target.value)} placeholder="Qty"  min="1" />
                </FormGroup>
                <FormGroup label="Price">
                  <input type="number"value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0 = Market" min="0" />
                </FormGroup>
              </div>

              <div className="order-form__summary">
                <div className="order-form__summary-row">
                  <span>Symbol</span><span>{form.tradingsymbol || '—'}</span>
                </div>
                <div className="order-form__summary-row">
                  <span>Token</span><span>{form.symboltoken || '—'}</span>
                </div>
                <div className="order-form__summary-row">
                  <span>Direction</span>
                  <span className={`order-form__summary-direction--${direction === 'BUY' ? 'buy' : 'sell'}`}>
                    {direction}
                  </span>
                </div>
                <div className="order-form__summary-row">
                  <span>Product</span><span>{form.producttype}</span>
                </div>
                <div className="order-form__summary-row">
                  <span>Accounts</span><span>{selectedClients.length}</span>
                </div>
              </div>

              <div className="order-form__actions">
                <Button variant="accent"  fullWidth loading={orderLoading}disabled={selectedClients.length === 0 || !loggedInClientCode || !form.symboltoken || orderLoading} onClick={handlePlaceOrder} icon={direction === 'BUY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />} >
                  Execute {direction} for {selectedClients.length} Account{selectedClients.length !== 1 ? 's' : ''}
                </Button>

                {activeClients.length === 0 && (
                  <p className="order-form__hint order-form__hint--error">
                    No active clients found. Please add or activate a client.
                  </p>
                )}
                {activeClients.length > 0 && !form.symboltoken && (
                  <p className="order-form__hint order-form__hint--warning">
                    Please search and select a symbol above.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="bulk-trading__left">
        <div className="card">
          <div className="card__head">
            <div>
              <h3>Account Selection</h3>
              <p>Select broker accounts for bulk trade</p>
            </div>
            <Badge color={selectedClients.length > 0 ? 'success' : 'default'}>
              {selectedClients.length} selected
            </Badge>
          </div>
          <div className="card__body">
            <div className="client-selection">

              <div className="client-selection__list">
                {brokerAccounts.length === 0 && (
                  <div className="client-selection__empty">
                    No active broker accounts found.
                  </div>
                )}

                {brokerAccounts.map(account => {
                  const isSelected = selectedClients.includes(account.selectionKey);
                  const initials   = getBrokerInitials(account.brokerName);

                  return (
                    <div  key={account.selectionKey} className={[ 'client-selection__item', isSelected       ? 'client-selection__item--selected' : '',  account.isMaster ? 'client-selection__item--master'   : '',].filter(Boolean).join(' ')} onClick={() => dispatch(toggleSelectedClient(account.selectionKey))} >
                      <input type="checkbox" checked={isSelected} onChange={() => dispatch(toggleSelectedClient(account.selectionKey))} onClick={e => e.stopPropagation()} />

                      <div className="client-selection__item-icon">
                        {initials}
                      </div>

                      <div className="client-selection__item-info">
                        <strong>{displayName}</strong>
                        <span className="client-selection__item-uid">{account.userId}</span>
                      </div>

                      <div className="client-selection__item-right">
                        <span
                          className="client-selection__item-broker-badge"
                          style={{ background: '#f0f0f0' }}
                        >
                          {account.isMaster ? '★ ' : ''}{account.brokerName}
                        </span>
                        <span className={`client-selection__item-auth client-selection__item-auth--${account.isAuthenticated ? 'ok' : 'pending'}`}>
                          {account.isAuthenticated ? '● Auth' : '○ Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="client-selection__footer">
                <span>
                  <strong>{selectedClients.length}</strong> of{' '}
                  <strong>{brokerAccounts.length}</strong> accounts selected
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