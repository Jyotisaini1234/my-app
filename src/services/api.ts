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

// ─── Broker credential shape (matches MongoDB BrokerCredentials) ──────────────
export interface BrokerCredentialPayload {
  userId?:        string;
  password?:      string;
  apiKey?:        string;
  totpSecret?:    string;
  totpToken?:     string;
  twoFa?:         string;
  imei?:          string;
  authorization?: string;
  enabled?:       boolean;
}

// ─── Add client payload ───────────────────────────────────────────────────────
export interface AddClientPayload {
  clientCode: string;
  name?:      string;
  email?:     string;
  phone?:     number;
  isActive?:  boolean;
  isMaster?:  boolean;
  /**
   * Broker map — keys are broker names (MOTILAL, SHOONYA).
   * Each value matches BrokerCredentials on the backend.
   * Example:
   * {
   *   MOTILAL: { userId, password, apiKey, totpSecret, twoFa, enabled: true },
   *   SHOONYA: { userId, password, apiKey, totpSecret, imei, enabled: true }
   * }
   */
  brokers?: Record<string, BrokerCredentialPayload>;
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

  /**
   * Add a new client.
   *
   * Backend endpoint: POST /api/client/add
   * Backend reads:
   *   - clientCode  → stored as client_code
   *   - name        → stored as name
   *   - email       → stored as email
   *   - phone       → stored as phone ($numberLong)
   *   - isActive    → stored as is_active
   *   - isMaster    → stored as is_master
   *   - brokers     → merged into brokers map  { MOTILAL: {...}, SHOONYA: {...} }
   *
   * Resulting MongoDB document shape:
   * {
   *   client_code: "SOAR1210",
   *   name: "...",
   *   email: "...",
   *   phone: { $numberLong: "9873443977" },
   *   is_active: true,
   *   is_master: false,
   *   brokers: {
   *     MOTILAL: { userId, password, apiKey, totpSecret, totpToken, twoFa, authorization, enabled },
   *     SHOONYA: { userId, password, apiKey, totpSecret, imei, authorization, enabled }
   *   }
   * }
   */
  add: (data: AddClientPayload) => {
    const body: Record<string, any> = {
      clientCode: data.clientCode,
    };

    if (data.name     != null) body.name     = data.name;
    if (data.email    != null) body.email    = data.email;
    if (data.phone    != null) body.phone    = data.phone;
    if (data.isActive != null) body.isActive = data.isActive;
    if (data.isMaster != null) body.isMaster = data.isMaster;

    // Build brokers map — only include fields that have non-empty values
    if (data.brokers && Object.keys(data.brokers).length > 0) {
      const cleanBrokers: Record<string, any> = {};
      Object.entries(data.brokers).forEach(([brokerName, creds]) => {
        const clean: Record<string, any> = { enabled: creds.enabled ?? true };
        if (creds.userId?.trim())        clean.userId        = creds.userId.trim();
        if (creds.password?.trim())      clean.password      = creds.password.trim();
        if (creds.apiKey?.trim())        clean.apiKey        = creds.apiKey.trim();
        if (creds.totpSecret?.trim())    clean.totpSecret    = creds.totpSecret.trim();
        if (creds.totpToken?.trim())     clean.totpToken     = creds.totpToken.trim();
        if (creds.twoFa?.trim())         clean.twoFa         = creds.twoFa.trim();
        if (creds.imei?.trim())          clean.imei          = creds.imei.trim();
        if (creds.authorization?.trim()) clean.authorization = creds.authorization.trim();
        cleanBrokers[brokerName] = clean;
      });
      body.brokers = cleanBrokers;
    }

    return request(`${BROKER_BASE}${API_ENDPOINTS.CLIENT.ADD}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

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

  getAllData: (params?: { startDate?: string; endDate?: string; page?: number;size?: number; clientCode?: string; masterClientCode?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate)       q.append('startDate',       params.startDate);
    if (params?.endDate)         q.append('endDate',         params.endDate);
    if (params?.clientCode)      q.append('clientCode',      params.clientCode);
    if (params?.masterClientCode) q.append('masterClientCode', params.masterClientCode);
    q.append('page', String(params?.page ?? 0));
    q.append('size', String(params?.size ?? 100));
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

  restoreArchive: (filename: string) =>
    request(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.RESTORE_ARCHIVE(filename)}`, {
      method: 'POST',
    }),

  getLokiStatus: () =>
    request(`${TRADE_BASE}${API_ENDPOINTS.EXPORT.LOKI_STATUS}`),
};