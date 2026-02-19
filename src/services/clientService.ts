// ─── API Base Configuration ──────────────────────────────────────────────────

const BROKER_BASE = 'http://ec2-13-202-238-201.ap-south-1.compute.amazonaws.com:8080/broker';
const TRADE_BASE  = 'http://ec2-13-233-121-193.ap-south-1.compute.amazonaws.com:8081';

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Client Service ──────────────────────────────────────────────────────────

export const clientService = {
  list: () =>
    apiCall<{ status: string; total: number; clients: Record<string, any> }>(
      `${BROKER_BASE}/api/client/list`
    ),

  listActive: () =>
    apiCall<{ status: string; total: number; clients: Record<string, any> }>(
      `${BROKER_BASE}/api/client/active`
    ),

  add: (data: {
    clientCode: string;
    userId: string;
    password: string;
    apiKey: string;
    totpSecret?: string;
    twoFa?: string;
    active?: boolean;
    master?: boolean;
  }) =>
    apiCall(`${BROKER_BASE}/api/client/add`, {
      method: 'POST',
      body: JSON.stringify({
        clientCode: data.clientCode,
        userId: data.userId,
        password: data.password,
        apiKey: data.apiKey,
        totpSecret: data.totpSecret || '',
        twoFa: data.twoFa || 'Y',
        active: data.active ?? true,
        master: data.master ?? false,
      }),
    }),

  authenticate: (clientCode: string) =>
    apiCall(`${BROKER_BASE}/api/client/authenticate/${clientCode}`, { method: 'POST' }),

  authenticateAll: () =>
    apiCall(`${BROKER_BASE}/api/client/authenticate-all`, { method: 'POST' }),

  delete: (clientCode: string) =>
    apiCall(`${BROKER_BASE}/api/client/delete/${clientCode}`, { method: 'DELETE' }),

  updateField: (clientCode: string, updates: Record<string, unknown>) =>
    apiCall(`${BROKER_BASE}/api/client/update-field/${clientCode}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
};

// ─── Trade Service ───────────────────────────────────────────────────────────

export const tradeService = {
  placeOrder: (orderRequest: any) => {
    const payload = {
      clientcode:        orderRequest.clientcode,
      exchange:          orderRequest.exchange,
      symboltoken:       Number(orderRequest.symboltoken),    
      buyorsell:         orderRequest.buyorsell || orderRequest.transactiontype,
      ordertype:         orderRequest.ordertype,
      producttype:       orderRequest.producttype,
      orderduration:     orderRequest.duration || orderRequest.orderduration || 'DAY',
      price:             Number(orderRequest.price) || 0,      
      triggerprice:      Number(orderRequest.triggerprice) || 0,
      quantityinlot:     Number(orderRequest.quantity) || Number(orderRequest.quantityinlot), 
      disclosedquantity: Number(orderRequest.disclosedquantity) || 0,
      amoorder:          orderRequest.amoorder || 'N',
      selectedClients:   orderRequest.selectedClients || [],    
    };

    console.log('Order payload being sent:', JSON.stringify(payload, null, 2));

    return apiCall(`${TRADE_BASE}/api/trade/place-order`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelOrder: (uniqueorderid: string) =>
    apiCall(`${TRADE_BASE}/api/trade/cancel-order-all`, {
      method: 'POST',
      body: JSON.stringify({ uniqueorderid }),
    }),

  getConfig: () => apiCall(`${TRADE_BASE}/api/trade/config`),
};

// ─── Log Service ─────────────────────────────────────────────────────────────

export const logService = {
  getAllData: (params?: { startDate?: string; endDate?: string; clientCode?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate)   q.append('endDate',   params.endDate);
    if (params?.clientCode) q.append('clientCode', params.clientCode);
    return apiCall(`${TRADE_BASE}/api/logs/data/all?${q.toString()}`);
  },

  getCount: (startDate: string, endDate: string, clientCode?: string) => {
    const q = new URLSearchParams({ startDate, endDate });
    if (clientCode) q.append('clientCode', clientCode);
    return apiCall(`${TRADE_BASE}/api/logs/data/count?${q.toString()}`);
  },

  getByClient: (clientCode: string, hours?: number) =>
    apiCall(`${TRADE_BASE}/api/logs/client/${clientCode}?hours=${hours ?? 24}`),
};

// ─── Broker Service ──────────────────────────────────────────────────────────

export const brokerService = {
  placeOrder: (orderRequest: any) =>
    apiCall(`${BROKER_BASE}/api/broker/place-order`, {
      method: 'POST',
      body: JSON.stringify(orderRequest),
    }),

  cancelOrder: (cancelRequest: any) =>
    apiCall(`${BROKER_BASE}/api/broker/cancel-order`, {
      method: 'POST',
      body: JSON.stringify(cancelRequest),
    }),

  searchSymbols: (clientCode: string, exchange: string, query?: string) => {
    const q = new URLSearchParams({ clientCode, exchange });
    if (query) q.append('query', query);
    return apiCall(`${BROKER_BASE}/api/broker/search-symbols?${q.toString()}`);
  },

  getClientProfile: (clientCode: string) =>
    apiCall(`${BROKER_BASE}/api/broker/profile/${clientCode}`),
};