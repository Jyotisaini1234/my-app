import { OrderRequest } from '../types/type';
import { API_CONFIG, ENDPOINTS } from './config';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const tradeService = {
  placeOrder: (data: OrderRequest) =>
    request(`${API_CONFIG.TRADE}${ENDPOINTS.PLACE_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  
  cancelOrder: (uniqueOrderId: string) =>
    request(`${API_CONFIG.TRADE}${ENDPOINTS.CANCEL_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueorderid: uniqueOrderId }),
    }),
};
