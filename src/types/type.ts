export interface TimelineResponse {
  status: string;
  totalLogs: number;
  timeline: TradeLog[];
  statistics: {
    successCount: number;
    errorCount: number;
    partialCount?: number;
    totalCount: number;
  };
}


export interface Client {
  client_code: string;
  user_id: string;
  password: string;
  api_key: string;
  totp_secret: string;
  two_fa: string;
  is_active: boolean;
  is_master: boolean;
  is_authenticated: boolean;
  totp_info?: any;
  last_login?: { $date: string };
  token_expiry?: { $date: string };
  created_at?: { $date: string };
  updated_at?: { $date: string };
}

export interface NewClientData {
  clientCode: string;
  userId: string;
  password: string;
  apiKey: string;
  totpSecret: string;
  twoFa: string;
  active: boolean;
  master: boolean;
}

export interface OrderRequest {
  clientcode?: string;
  exchange: string;
  symboltoken: string;
  buyorsell: string;
  ordertype: string;
  price: string;
  quantityinlot: string;
  disclosedquantity?: string;
  triggerprice?: string;
  producttype: string;
  orderduration?: string;
  amoorder?: string;
  selectedClients?: string[];
}

export interface OrderPayload {
  clientcode: string;
  exchange: string;
  symboltoken: number;
  buyorsell: string;
  ordertype: string;
  price: number;
  quantityinlot: number;
  disclosedquantity?: number;
  triggerprice?: number;
  producttype: string;
  orderduration?: string;
  amoorder?: string;
  selectedClients: string[];
}

export interface LogsResponse {
  status: string;
  requestId?: string;
  traceId?: string;
  clientCode?: string;
  count: number;
  logs: TradeLog[];
  lokiLogs?: any[];
  grafanaLokiUrl?: string;
}

export type TabType = 'clients' | 'orders' | 'logs';

export interface TimelineFilters {
  clientCode?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  action?: string;
  endpoint?: string;
  limit?: number;
}

export interface TradeLog {
  id?: number;
  traceId?: string;
  trace_id?: string;
  spanId?: string;
  span_id?: string;
  requestId?: string;
  request_id?: string;
  timestamp?: string | number | Date;
  clientCode?: string;
  client_code?: string;
  clientName?: string;
  client_name?: string;
  action?: string;
  status?: string;
  requestTime?: string | Date;
  responseTime?: string | Date;
  durationMs?: number;
  errorMessage?: string;
  created_at?: { $date: string } | string | Date;
  createdAt?: string | Date;
  unique_order_id?: string;
  level?: string;
  message?: string;
  thread?: string;
  logger?: string;
}

export interface TimelineResponse {
  status: string;
  totalLogs: number;
  timeline: TradeLog[];
  statistics: {
    successCount: number;
    errorCount: number;
    partialCount?: number;
    totalCount: number;
  };
}

// Types
export interface Client {
  client_code: string;
  is_master: boolean;
  is_authenticated: boolean;
}

export interface SymbolData {
  exchange: string;
  scripcode: number;
  scripfullname: string;
  scripshortname: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}


export interface OrderModalProps {
  selectedClients: string[];
  clients: Record<string, Client>;
  onClose: () => void;
  onSuccess: (log: any) => void;
}
export interface ApiResponse<T = any> {
  status: string;
  data?: T;
  message?: string;
  results?: any;
  clients?: T;
  [key: string]: any;
}

export interface SymbolSearchResponse {
  status: string;
  data: Array<{
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
  }>;
}

export interface OrderResponse {
  status: string;
  data?: any;
  results?: Record<string, any>;
  message?: string;
}
