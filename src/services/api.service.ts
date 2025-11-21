import { NewClientData, OrderRequest } from "../types/type";
import { API_BASE_URL_8080, API_ENDPOINTS } from "../utils/ApiConstants";


export const apiService = {
  fetchClients: async () => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.CLIENTS.LIST}`);
    return res.json();
  },

  authenticateClient: async (clientCode: string) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.CLIENTS.AUTHENTICATE(clientCode)}`, {
      method: 'POST'
    });
    return res.json();
  },

  authenticateAll: async () => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.CLIENTS.AUTHENTICATE_ALL}`, {
      method: 'POST'
    });
    return res.json();
  },

  logoutClient: async (clientCode: string) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.CLIENTS.LOGOUT(clientCode)}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  addClient: async (data: NewClientData) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.CLIENTS.ADD}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteClient: async (clientCode: string) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.CLIENTS.DELETE(clientCode)}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  placeOrder: async (data: OrderRequest) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.TRADE.PLACE_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  placeSingleOrder: async (data: OrderRequest) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.TRADE.PLACE_SINGLE_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  cancelOrder: async (uniqueorderid: string) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.TRADE.CANCEL_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueorderid })
    });
    return res.json();
  },

  cancelSingleOrder: async (data: { clientcode: string; uniqueorderid: string }) => {
    const res = await fetch(`${API_BASE_URL_8080}${API_ENDPOINTS.TRADE.CANCEL_SINGLE_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
