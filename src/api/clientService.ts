import { Client, NewClientData } from '../types/type';
import { API_CONFIG, ENDPOINTS } from './config';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const clientService = {
  list: () => 
    request<{ status: string; clients: Record<string, Client> }>(`${API_CONFIG.BROKER}${ENDPOINTS.CLIENT_LIST}`),
  
  add: (data: NewClientData) =>
    request(`${API_CONFIG.BROKER}${ENDPOINTS.CLIENT_ADD}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  
  delete: (code: string) =>
    request(`${API_CONFIG.BROKER}${ENDPOINTS.CLIENT_DELETE(code)}`, {
      method: 'DELETE',
    }),
  
  authenticate: (code: string) =>
    request(`${API_CONFIG.BROKER}${ENDPOINTS.CLIENT_AUTH(code)}`, {
      method: 'POST',
    }),
  
  authenticateAll: () =>
    request(`${API_CONFIG.BROKER}${ENDPOINTS.CLIENT_AUTH_ALL}`, {
      method: 'POST',
    }),
  
  logout: (code: string) =>
    request(`${API_CONFIG.BROKER}${ENDPOINTS.CLIENT_LOGOUT(code)}`, {
      method: 'DELETE',
    }),
};

