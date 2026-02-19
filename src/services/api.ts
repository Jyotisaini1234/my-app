import { ApiResponse, OrderResponse, SymbolSearchResponse } from "../types/type";
import { API_BASE_URL_8080, API_BASE_URL_8081, API_ENDPOINTS } from "../utils/ApiConstants";

async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const brokerApi = {
  searchSymbols: (clientCode: string, exchange: string, query?: string) => {
    const params = new URLSearchParams({ clientCode, exchange, ...(query && { query }) });
    return request<SymbolSearchResponse>(
      `${API_BASE_URL_8080}${API_ENDPOINTS.BROKER.SEARCH_SYMBOLS}?${params}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );
  },

  getProfile: (clientCode: string) =>
    request<ApiResponse>(`${API_BASE_URL_8080}${API_ENDPOINTS.BROKER.PROFILE(clientCode)}`),

  healthCheck: () =>
    request<ApiResponse>(`${API_BASE_URL_8080}${API_ENDPOINTS.BROKER.HEALTH}`),

  placeOrder: (clientCode: string, orderData: any) =>
    request<OrderResponse>(`${API_BASE_URL_8080}${API_ENDPOINTS.BROKER.PLACE_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-Code': clientCode },
      body: JSON.stringify(orderData),
    }),

  cancelOrder: (clientCode: string, uniqueOrderId: string) =>
    request<ApiResponse>(`${API_BASE_URL_8080}${API_ENDPOINTS.BROKER.CANCEL_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-Code': clientCode },
      body: JSON.stringify({ uniqueorderid: uniqueOrderId }),
    }),
};

export const tradeService = {
  placeOrder: (orderRequest: any) => {
    // ── Backend exactly wahi expect karta hai jo yahan map ho raha hai ──
    const payload = {
      clientcode:        orderRequest.clientcode,
      exchange:          orderRequest.exchange,
      symboltoken:       Number(orderRequest.symboltoken),                               // string → number
      buyorsell:         orderRequest.buyorsell || orderRequest.transactiontype,
      ordertype:         orderRequest.ordertype,
      producttype:       orderRequest.producttype,                                       // MIS / CNC / NRML
      orderduration:     orderRequest.duration || orderRequest.orderduration || 'DAY',  // sahi field name
      price:             Number(orderRequest.price) || 0,
      triggerprice:      Number(orderRequest.triggerprice) || 0,
      quantityinlot:     Number(orderRequest.quantity) || Number(orderRequest.quantityinlot), // sahi field + number
      disclosedquantity: 0,
      amoorder:          'N',
      selectedClients:   orderRequest.selectedClients || [],
    };

    console.log('Order payload:', JSON.stringify(payload, null, 2));

    return request<OrderResponse>(`${API_BASE_URL_8081}${API_ENDPOINTS.TRADE.PLACE_ORDER}`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify(payload),
});
  },

  placeSingleOrder: (clientCode: string, orderData: any) =>
    request<OrderResponse>(`${API_BASE_URL_8081}${API_ENDPOINTS.TRADE.PLACE_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-Code': clientCode },
      body: JSON.stringify(orderData),
    }),

  cancelOrder: (uniqueOrderId: string) =>
    request<ApiResponse>(`${API_BASE_URL_8081}${API_ENDPOINTS.TRADE.CANCEL_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueorderid: uniqueOrderId }),
    }),

  cancelSingleOrder: (data: { clientcode: string; uniqueorderid: string }) =>
    request<ApiResponse>(`${API_BASE_URL_8081}${API_ENDPOINTS.TRADE.CANCEL_SINGLE_ORDER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};

export const api = { ...brokerApi, ...tradeService };
export const apiService = api;
export type { ApiResponse, SymbolSearchResponse, OrderResponse };