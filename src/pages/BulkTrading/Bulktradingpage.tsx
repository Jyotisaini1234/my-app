import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, X } from 'lucide-react';

import './BulkTradingPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedClients, placeOrderForAll, toggleSelectedClient, clearResult } from '../../store/slice/bulkTradeSlice/bulkTradeSlice';
import { fetchActiveClients } from '../../store/slice/clientsSlice/clientsSlice';
import { Badge } from '../../components/common/Badge/Badge';
import { Button } from '../../components/common/Button/Button';
import { FormGroup } from '../../components/common/FormGroup/FormGroup';

export const BulkTradingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: clients } = useAppSelector((s) => s.clients);
  const { loading, lastResult, selectedClients } = useAppSelector((s) => s.bulkTrade);

  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [form, setForm] = useState({
    tradingsymbol: '',
    symboltoken: '',
    exchange: 'NSE',
    ordertype: 'MARKET',
    producttype: 'INTRADAY',
    duration: 'DAY',
    price: '0',
    quantity: '',
    squareoff: '0',
    stoploss: '0',
    variety: 'NORMAL',
  });

  useEffect(() => {
    dispatch(fetchActiveClients());
  }, [dispatch]);

  const activeClients = Object.values(clients).filter((c) => c.is_active);
  const masterClient = activeClients.find((c) => c.is_master);

  const allSelected = activeClients.length > 0 && selectedClients.length === activeClients.length;

  const handleSelectAll = () => {
    if (allSelected) {
      dispatch(setSelectedClients([]));
    } else {
      dispatch(setSelectedClients(activeClients.map((c) => c.client_code)));
    }
  };

  const handlePlaceOrder = () => {
    if (!masterClient) return;
    if (!form.tradingsymbol || !form.quantity) {
      alert('Symbol and Quantity are required');
      return;
    }
    dispatch(
      placeOrderForAll({
        clientcode: masterClient.client_code,
        variety: form.variety,
        tradingsymbol: form.tradingsymbol.toUpperCase(),
        symboltoken: form.symboltoken,
        transactiontype: direction,
        exchange: form.exchange,
        ordertype: form.ordertype,
        producttype: form.producttype,
        duration: form.duration,
        price: form.price,
        squareoff: form.squareoff,
        stoploss: form.stoploss,
        quantity: form.quantity,
        buyorsell: direction,
      })
    );
  };

  const setF = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="bulk-trading">
      {/* LEFT COLUMN */}
      <div className="bulk-trading__left">
        {/* Client Selection */}
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
                      ]
                        .filter(Boolean)
                        .join(' ')}
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
                    {res.status === 'success' ? (
                      <CheckCircle size={16} color="#10b981" />
                    ) : (
                      <XCircle size={16} color="#ef4444" />
                    )}
                    {res.orderid && <span className="order-id">{res.orderid}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN — Order Form */}
      <div className="bulk-trading__right">
        <div className="card">
          <div className="card__head">
            <div>
              <h3>Place Bulk Trade</h3>
              <p>Execute across {selectedClients.length || 'selected'} clients</p>
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

              <FormGroup label="Stock Symbol *">
                <input
                  value={form.tradingsymbol}
                  onChange={(e) => setF('tradingsymbol', e.target.value.toUpperCase())}
                  placeholder="e.g. NIFTY50, RELIANCE"
                />
              </FormGroup>

              <div className="form-row">
                <FormGroup label="Symbol Token">
                  <input
                    value={form.symboltoken}
                    onChange={(e) => setF('symboltoken', e.target.value)}
                    placeholder="Token ID"
                  />
                </FormGroup>
                <FormGroup label="Exchange">
                  <select value={form.exchange} onChange={(e) => setF('exchange', e.target.value)}>
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NFO">NFO</option>
                    <option value="MCX">MCX</option>
                  </select>
                </FormGroup>
              </div>

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
                    <option value="INTRADAY">INTRADAY</option>
                    <option value="DELIVERY">DELIVERY</option>
                    <option value="CARRYFORWARD">CARRYFORWARD</option>
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
                  <span>Direction</span>
                  <span style={{ color: direction === 'BUY' ? '#10b981' : '#ef4444' }}>
                    {direction}
                  </span>
                </div>
                <div className="order-form__summary-row">
                  <span>Clients</span>
                  <span>{selectedClients.length}</span>
                </div>
                <div className="order-form__summary-row order-form__summary-row--total">
                  <span>Via</span>
                  <span>Motilal Oswal</span>
                </div>
              </div>

              <div className="order-form__actions">
                <Button
                  variant="accent"
                  fullWidth
                  loading={loading}
                  disabled={selectedClients.length === 0 || !masterClient}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};