import { BROKER_BASE, TRADE_BASE, API_ENDPOINTS } from '../utils/ApiConstants';


async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.error || err.message || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export const clientService = {

  list: () =>
    request<{ status: string; total: number; clients: Record<string, any> }>(
      `${BROKER_BASE}${API_ENDPOINTS.CLIENT.LIST}`
    ),

  listActive: () =>
    request<{ status: string; total: number; clients: Record<string, any> }>(
      `${BROKER_BASE}${API_ENDPOINTS.CLIENT.LIST_ACTIVE}`
    ),

  details: (clientCode: string) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.DETAILS(clientCode)}`),

  // ✅ FIX: email, phone, authorization, totpToken added to type + body
  add: (data: {
    clientCode:     string;
    userId:         string;
    password:       string;
    apiKey:         string;
    totpSecret?:    string;
    totpToken?:     string;
    twoFa?:         string;
    active?:        boolean;
    master?:        boolean;
    email?:         string;
    phone?:         number;
    authorization?: string;
  }) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.ADD}`, {
      method: 'POST',
      body: JSON.stringify({
        clientCode:  data.clientCode,
        userId:      data.userId,
        password:    data.password,
        apiKey:      data.apiKey,
        totpSecret:  data.totpSecret    ?? '',
        totpToken:   data.totpToken     ?? '',
        twoFa:       data.twoFa         ?? '',
        active:      data.active        ?? true,
        master:      data.master        ?? false,
        // ✅ yeh fields pehle body mein the hi nahi — isliye save nahi ho rahe the
        ...(data.email         ? { email:         data.email }         : {}),
        ...(data.phone         ? { phone:         data.phone }         : {}),
        ...(data.authorization ? { authorization: data.authorization } : {}),
      }),
    }),

  update: (clientCode: string, data: Record<string, unknown>) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.UPDATE(clientCode)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateField: (clientCode: string, updates: Record<string, unknown>) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.UPDATE_FIELD(clientCode)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  authenticate: (clientCode: string) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.AUTHENTICATE(clientCode)}`, {
      method: 'POST',
    }),

  authenticateAll: () =>
    request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.AUTHENTICATE_ALL}`, {
      method: 'POST',
    }),

  delete: (clientCode: string) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.DELETE(clientCode)}`, {
      method: 'DELETE',
    }),
};

export const brokerService = {

  placeOrder: (orderRequest: any) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.BROKER.PLACE_ORDER}`, {
      method: 'POST',
      body: JSON.stringify(orderRequest),
    }),

  cancelOrder: (cancelRequest: any) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.BROKER.CANCEL_ORDER}`, {
      method: 'POST',
      body: JSON.stringify(cancelRequest),
    }),

  searchSymbols: (clientCode: string, exchange: string, query?: string) => {
    const params = new URLSearchParams({ clientCode, exchange });
    if (query) params.append('query', query);
    return request(`${BROKER_BASE}${API_ENDPOINTS.BROKER.SEARCH_SYMBOLS}?${params}`);
  },

  getClientProfile: (clientCode: string) =>
    request(`${BROKER_BASE}${API_ENDPOINTS.BROKER.PROFILE(clientCode)}`),

  health: () =>
    request(`${BROKER_BASE}${API_ENDPOINTS.BROKER.HEALTH}`),
};

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
      price:             Number(orderRequest.price)             || 0,
      triggerprice:      Number(orderRequest.triggerprice)      || 0,
      quantityinlot:     Number(orderRequest.quantity)          || Number(orderRequest.quantityinlot),
      disclosedquantity: Number(orderRequest.disclosedquantity) || 0,
      amoorder:          orderRequest.amoorder || 'N',
      selectedClients:   orderRequest.selectedClients || [],
    };
    return request(`${TRADE_BASE}${API_ENDPOINTS.TRADE.PLACE_ORDER}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelOrder: (uniqueorderid: string) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.TRADE.CANCEL_ORDER}`, {
      method: 'POST',
      body: JSON.stringify({ uniqueorderid }),
    }),

  getConfig: () =>
    request(`${TRADE_BASE}${API_ENDPOINTS.TRADE.CONFIG}`),

  health: () =>
    request(`${TRADE_BASE}${API_ENDPOINTS.TRADE.HEALTH}`),
};

export const logService = {

  getTrace: (traceId: string) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.TRACE(traceId)}`),

  getSpan: (spanId: string) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.SPAN(spanId)}`),

  getTraceSpan: (traceId: string, spanId: string) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.TRACE_SPAN(traceId, spanId)}`),

  getByClient: (clientCode: string, hours = 24, params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams({ hours: String(hours) });
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate)   q.append('endDate',   params.endDate);
    return request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.CLIENT(clientCode)}?${q}`);
  },

  getByClientName: (clientName: string, hours = 24) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.CLIENT_NAME(clientName)}?hours=${hours}`),

  getByClientGrouped: (clientCode: string, hours = 24) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.CLIENT_GROUPED(clientCode)}?hours=${hours}`),

  getAllData: (params?: { startDate?: string; endDate?: string; clientCode?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate)  q.append('startDate',  params.startDate);
    if (params?.endDate)    q.append('endDate',     params.endDate);
    if (params?.clientCode) q.append('clientCode',  params.clientCode);
    return request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.DATA_ALL}?${q}`);
  },

  getCount: (startDate: string, endDate: string, clientCode?: string, includeData = false) => {
    const q = new URLSearchParams({ startDate, endDate, includeData: String(includeData) });
    if (clientCode) q.append('clientCode', clientCode);
    return request(`${TRADE_BASE}${API_ENDPOINTS.LOGS.DATA_COUNT}?${q}`);
  },
};

export const exportService = {

  listRemote: () =>
    request(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.LIST_REMOTE}`),

  downloadRemote: (filename: string) =>
    fetch(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.DOWNLOAD_REMOTE(filename)}`, {
      credentials: 'include',
    }),

  uploadArchive: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.UPLOAD_ARCHIVE}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  },

  deleteRemote: (filename: string) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.DELETE_REMOTE(filename)}`, {
      method: 'DELETE',
    }),

  restoreArchive: (filename: string) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.RESTORE_ARCHIVE(filename)}`, {
      method: 'POST',
    }),

  getLokiStatus: () =>
    request(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.LOKI_STATUS}`),
};