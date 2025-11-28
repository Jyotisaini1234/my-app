import React from 'react';
import { Send } from 'lucide-react';
import { Badge } from '../common/Badge/Badge';
import { Client } from '../../types/type';
import { Button } from '@mui/material';

interface OrdersTabProps {
  clients: Client[];
  selectedClients: Set<string>;
  onToggleClient: (clientCode: string) => void;
  onPlaceOrder: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ clients, selectedClients, onToggleClient, onPlaceOrder }) => {
  const authenticatedClients = clients.filter(c => c.is_authenticated && c.is_active);
  
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Select Clients for Order</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {authenticatedClients.map((client) => (
            <label  key={client.client_code} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: selectedClients.has(client.client_code) ? '#1e40af' : '#1e293b',border: `2px solid ${selectedClients.has(client.client_code) ? '#3b82f6' : '#334155'}`,borderRadius: '0.5rem',  cursor: 'pointer',transition: 'all 0.2s' }}>
              <input type="checkbox" checked={selectedClients.has(client.client_code)} onChange={() => onToggleClient(client.client_code)} style={{ width: '18px', height: '18px', cursor: 'pointer' }}/>
              <div>
                <div style={{ fontWeight: 'bold' }}>{client.client_code}</div>
                {client.is_master && <Badge color="#f59e0b" style={{ marginTop: '0.25rem' }}>Master</Badge>}
              </div>
            </label>
          ))}
        </div>
      </div>
      <Button onClick={onPlaceOrder}  disabled={selectedClients.size === 0}color="primary" variant="contained"startIcon={<Send size={20} />} style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>Place Order for {selectedClients.size} Client{selectedClients.size !== 1 ? 's' : ''}</Button>
    </div>
  );
};