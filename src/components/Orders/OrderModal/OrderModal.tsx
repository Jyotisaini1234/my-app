import React, { useState } from 'react';
import { api } from '../../../services/api';
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

export const OrderModal: React.FC<OrderModalProps> = ({ selectedClients, clients, onClose, onSuccess }) => {
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

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      let results: any = {};
      const masterClient = Object.values(clients).find(c => c.is_master);
      
      if (!masterClient) {
        alert('No master client found');
        setLoading(false);
        return;
      }

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

      if (selectedClients.length === 1) {
        const result = await api.placeSingleOrder(selectedClients[0], orderPayload);
        results[selectedClients[0]] = result;
      } else {
        const response = await api.placeMultipleOrder(orderPayload);
        results = response.results || {};
      }

      const log: TradeLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'ORDER',
        clients: selectedClients,
        symbol: formData.symboltoken,
        side: formData.buyorsell,
        quantity: formData.quantityinlot,
        status: Object.values(results).every((r: any) => r.status === 'success')  ? 'SUCCESS'   : Object.values(results).some((r: any) => r.status === 'success') ? 'PARTIAL'  : 'FAILED',
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

  const isStopLossOrder = formData.ordertype === 'STOPLOSS_LIMIT' ||  formData.ordertype === 'STOPLOSS_MARKET';
  const isLimitOrder = formData.ordertype !== 'MARKET';

  return (
    <Modal title="Place Order" onClose={onClose}>
      <div className="order-modal">
        <div className="order-modal__form">
          <FormGroup label="Symbol Token *">
            <input type="text" value={formData.symboltoken}  onChange={e => setFormData({...formData, symboltoken: e.target.value})} placeholder="10576"className="order-modal__input" />
          </FormGroup>

          <FormGroup label="Exchange">
            <select  value={formData.exchange}onChange={e => setFormData({...formData, exchange: e.target.value})}  className="order-modal__select"  >
              <option>NSE</option>
              <option>BSE</option>
              <option>NFO</option>
              <option>MCX</option>
            </select>
          </FormGroup>

          <FormGroup label="Buy/Sell">
            <select value={formData.buyorsell} onChange={e => setFormData({...formData, buyorsell: e.target.value as any})} className="order-modal__select" >
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </FormGroup>

          <FormGroup label="Order Type">
            <select value={formData.ordertype}  onChange={e => setFormData({...formData, ordertype: e.target.value as any})} className="order-modal__select"  >
              <option>MARKET</option>
              <option>LIMIT</option>
              <option>STOPLOSS_LIMIT</option>
              <option>STOPLOSS_MARKET</option>
            </select>
          </FormGroup>

          <FormGroup label="Product Type">
            <select value={formData.producttype} onChange={e => setFormData({...formData, producttype: e.target.value as any})}  className="order-modal__select">
              <option>DELIVERY</option>
              <option>INTRADAY</option>
              <option>MARGIN</option>
              <option>BO</option>
              <option>CO</option>
            </select>
          </FormGroup>

          <FormGroup label="Quantity">
            <input  type="number"  value={formData.quantityinlot} onChange={e => setFormData({...formData, quantityinlot: e.target.value || '1'})} min="1"className="order-modal__input" />
          </FormGroup>

          {isLimitOrder && (
            <FormGroup label="Price">
              <input type="number"step="0.05" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="order-modal__input" />
            </FormGroup>
          )}

          {isStopLossOrder && (
            <FormGroup label="Trigger Price">
              <input type="number"step="0.05" value={formData.triggerprice || ''} onChange={e => setFormData({...formData, triggerprice: e.target.value})} className="order-modal__input" />
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
          <Button onClick={onClose} variant="contained" color="secondary" className="order-modal__button">Cancel</Button>
          <Button onClick={handleSubmit}disabled={loading || !formData.symboltoken} className="order-modal__button"> {loading ? 'Placing Order...' : 'Place Order'} </Button>
        </div>
      </div>
    </Modal>
  );
};