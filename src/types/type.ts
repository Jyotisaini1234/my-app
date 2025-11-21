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

export interface TradeLog {
  type: string;
  timestamp: string | number | Date;
  symbol: string;
  side: string;
  clients: any;
  results(results: any): unknown;
  id: number;
  requestId: string;
  traceId: string;
  endpoint: string;
  httpMethod: string;
  clientCode: string;
  masterClient: string;
  replicatedClient: string;
  requestTime: string;
  responseTime: string;
  durationMs: number;
  status: string;
  statusCode: number;
  errorMessage: string;
  message: string;
  exchange?: string;
  symbolToken?: string;
  buyOrSell?: string;
  orderType?: string;
  quantity?: number;
  price?: number;
  uniqueOrderId?: string;
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

export interface TimelineFilters {
  clientCode?: string;
  endpoint?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  status?:string;
  requestType?:string;
}

export interface TimelineResponse {
  status: string;
  totalLogs: number;
  filters: Record<string, any>;
  timeline: any[];
  groupedByEndpoint: Record<string, any[]>;
  statistics: {
    successCount: number;
    errorCount: number;
    avgDurationMs: number;
    requestTypeBreakdown: Record<string, number>;
  };
}

export type TabType = 'clients' | 'orders' | 'logs';

