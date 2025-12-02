import React, { useState, useEffect, useRef } from 'react';
import { tradeService, brokerApi } from '../../../services/api';
import { Client, TradeLog, OrderRequest } from '../../../types/type';
import { FormGroup } from '../../common/FormGroup/FormGroup';
import { Modal } from '../../common/Modal/Modal';
import './OrderModal.scss';
import { Button } from '@mui/material';

interface OrderModalProps {
  selectedClients: string[];
  clients: Record<string, Client>;
  onClose: () => void;
  onSuccess: (log: TradeLog) => void;
}

interface SymbolData {
  exchange: string;
  scripcode: number;
  scripfullname: string;
  scripshortname: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({ 
  selectedClients, 
  clients, 
  onClose, 
  onSuccess 
}) => {
  // Form state
  const [formData, setFormData] = useState<OrderRequest>({
    clientcode: '',
    symboltoken: '',
    exchange: 'NSE',
    buyorsell: 'BUY',
    ordertype: 'MARKET',
    producttype: 'DELIVERY',
    quantityinlot: '1',
    price: '0',
    orderduration: 'DAY',
    triggerprice: '0',
    disclosedquantity: '0',
    amoorder: 'N'
  });
  
  const [loading, setLoading] = useState(false);
  
  // Symbol search states
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SymbolData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get master client
  const masterClient = Object.values(clients).find(c => c.is_master);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch symbol data using API service
  const fetchSymbolData = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (!masterClient) {
      console.error('No master client found');
      return;
    }

    setSearchLoading(true);
    try {
      const data = await brokerApi.searchSymbols(
        masterClient.client_code,
        formData.exchange,
        query
      );
      
      if (data.status === 'SUCCESS' && data.data) {
        setSuggestions(data.data);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching symbol data:', error);
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchSymbolData(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, formData.exchange]);

  // Handle symbol selection
  const handleSymbolSelect = (symbol: SymbolData) => {
    setSelectedSymbol(symbol);
    setSearchTerm('');
    setShowDropdown(false);
    setFormData({
      ...formData,
      symboltoken: symbol.scripcode.toString(),
      exchange: symbol.exchange
    });
  };

  // Clear selected symbol
  const handleClearSymbol = () => {
    setSelectedSymbol(null);
    setSearchTerm('');
    setSuggestions([]);
    setFormData({
      ...formData,
      symboltoken: ''
    });
  };

  // Submit order
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      let results: any = {};
      
      if (!masterClient) {
        alert('No master client found');
        setLoading(false);
        return;
      }

      // Prepare order payload
      const orderPayload: any = {
        clientcode: masterClient.client_code,
        exchange: formData.exchange,
        symboltoken: parseInt(formData.symboltoken),
        buyorsell: formData.buyorsell,
        ordertype: formData.ordertype,
        producttype: formData.producttype,
        orderduration: formData.orderduration || 'DAY',
        price: parseFloat(formData.price) || 0,
        triggerprice: parseFloat(formData.triggerprice || '0') || 0,
        quantityinlot: parseInt(formData.quantityinlot),
        disclosedquantity: parseInt(formData.disclosedquantity || '0') || 0,
        amoorder: formData.amoorder || 'N',
        selectedClients: selectedClients
      };

      // Place order using API service
      if (selectedClients.length === 1) {
        const result = await tradeService.placeSingleOrder(selectedClients[0], orderPayload);
        results[selectedClients[0]] = result;
      } else {
        const response = await tradeService.placeOrder(orderPayload);
        results = response.results || {};
      }

      // Create trade log
      const log: TradeLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'ORDER',
        clients: selectedClients,
        symbol: formData.symboltoken,
        side: formData.buyorsell,
        quantity: formData.quantityinlot,
        status: Object.values(results).every((r: any) => r.status === 'success') 
          ? 'SUCCESS' 
          : Object.values(results).some((r: any) => r.status === 'success') 
          ? 'PARTIAL' 
          : 'FAILED',
        results,
        masterClient: selectedClients[0] || '',
        replicatedClient: selectedClients[1] || '',
        exchange: formData.exchange,
        symbolToken: formData.symboltoken,
        buyOrSell: formData.buyorsell,
        orderType: formData.ordertype,
        price: formData.price,
        uniqueOrderId: Date.now().toString(),
        message: 'Order placed'
      } as unknown as TradeLog;

      onSuccess(log);
    } catch (err) {
      alert('Order placement failed: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const isStopLossOrder = formData.ordertype === 'STOPLOSS_LIMIT' || formData.ordertype === 'STOPLOSS_MARKET';
  const isLimitOrder = formData.ordertype !== 'MARKET';

  return (
    <Modal title="Place Order" onClose={onClose}>
      <div className="order-modal">
        <div className="order-modal__form">
          
          {/* Symbol Search */}
          <FormGroup label="Search Symbol *">
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              {selectedSymbol ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  border: '2px solid #4CAF50',
                  borderRadius: '4px',
                  backgroundColor: '#f1f8f4'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {selectedSymbol.scripshortname}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Code: {selectedSymbol.scripcode} | {selectedSymbol.exchange}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSymbol}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#d32f2f',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '0 5px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      placeholder="Search by code, name or symbol..."
                      className="order-modal__input"
                      style={{ paddingRight: '80px' }}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowDropdown(true);
                      }}
                    />
                    {searchLoading && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        Loading...
                      </span>
                    )}
                  </div>

                  {showDropdown && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {suggestions.map((symbol) => (
                        <div
                          key={symbol.scripcode}
                          onClick={() => handleSymbolSelect(symbol)}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#333' }}>
                                {symbol.scripshortname}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                {symbol.scripfullname}
                              </div>
                              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Code: {symbol.scripcode} | {symbol.exchange}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '12px' }}>
                              <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                ₹{symbol.close.toFixed(2)}
                              </div>
                              <div style={{ color: '#999', fontSize: '10px' }}>
                                Vol: {(symbol.volume / 1000).toFixed(1)}K
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showDropdown && !searchLoading && searchTerm && suggestions.length === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      color: '#666',
                      textAlign: 'center',
                      zIndex: 1000
                    }}>
                      No symbols found
                    </div>
                  )}
                </>
              )}
            </div>
          </FormGroup>

          <FormGroup label="Exchange">
            <select 
              value={formData.exchange}
              onChange={e => {
                setFormData({...formData, exchange: e.target.value});
                setSelectedSymbol(null);
              }}
              className="order-modal__select"
            >
              <option>NSE</option>
              <option>BSE</option>
              <option>NFO</option>
              <option>MCX</option>
            </select>
          </FormGroup>

          <FormGroup label="Buy/Sell">
            <select 
              value={formData.buyorsell} 
              onChange={e => setFormData({...formData, buyorsell: e.target.value as any})} 
              className="order-modal__select"
            >
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </FormGroup>

          <FormGroup label="Order Type">
            <select 
              value={formData.ordertype} 
              onChange={e => setFormData({...formData, ordertype: e.target.value as any})} 
              className="order-modal__select"
            >
              <option>MARKET</option>
              <option>LIMIT</option>
              <option>STOPLOSS_LIMIT</option>
              <option>STOPLOSS_MARKET</option>
            </select>
          </FormGroup>

          <FormGroup label="Product Type">
            <select 
              value={formData.producttype} 
              onChange={e => setFormData({...formData, producttype: e.target.value as any})} 
              className="order-modal__select"
            >
              <option>DELIVERY</option>
              <option>INTRADAY</option>
              <option>MARGIN</option>
              <option>BO</option>
              <option>CO</option>
            </select>
          </FormGroup>

          <FormGroup label="Quantity">
            <input 
              type="number" 
              value={formData.quantityinlot} 
              onChange={e => setFormData({...formData, quantityinlot: e.target.value || '1'})} 
              min="1"
              className="order-modal__input" 
            />
          </FormGroup>

          {isLimitOrder && (
            <FormGroup label="Price">
              <input 
                type="number"
                step="0.05" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
                className="order-modal__input" 
              />
            </FormGroup>
          )}

          {isStopLossOrder && (
            <FormGroup label="Trigger Price">
              <input 
                type="number"
                step="0.05" 
                value={formData.triggerprice || ''} 
                onChange={e => setFormData({...formData, triggerprice: e.target.value})} 
                className="order-modal__input" 
              />
            </FormGroup>
          )}
        </div>

        <div className="order-modal__clients-info">
          <div className="clients-info__label">
            <strong>Selected Clients ({selectedClients.length}):</strong>
          </div>
          <div className="clients-info__list">
            {selectedClients.join(', ')}
          </div>
        </div>

        <div className="order-modal__actions">
          <Button 
            onClick={onClose} 
            variant="contained" 
            color="secondary" 
            className="order-modal__button"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.symboltoken} 
            className="order-modal__button"
          > 
            {loading ? 'Placing Order...' : 'Place Order'} 
          </Button>
        </div>
      </div>
    </Modal>
  );
};