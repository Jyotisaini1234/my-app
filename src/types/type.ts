
export interface AuthUser {
  id: string;
  clientCode: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  role: string;
  status: string;
  lastLoginAt?: string;
}

export interface PendingSignup {
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
}

export type AuthView = 'login' | 'forgot';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  resetToken: string | null;
  forgotEmail: string | null;
  forgotStep: 1 | 2 | 3;
  authView: AuthView;
  pendingSignup: PendingSignup | null;
}





export interface ClientDetails {
  client_code: string;
  user_id: string;
  is_active: boolean;
  is_master: boolean;
  email?: string;
  phone?: number;
  is_authenticated: boolean;
  last_login?: string;
  token_expiry?: string;
}

export interface GroupEntry {
  group_id: string;
  group_name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  client_codes?: string[];
  client_count?: number;
  clients: Record<string, ClientDetails>;
}

export interface GroupsListResponse {
  status: string;
  total: number;
  groups: Record<string, GroupEntry>;
}

export interface GroupResponse {
  status: string;
  message?: string;
  data: GroupEntry;
}

export interface CreateGroupPayload {
  group_name: string;
  created_by: string;
  client_codes?: string[];
}

export interface AddRemoveClientsPayload {
  groupName: string;
  client_codes: string[];
}

export interface RenameGroupPayload {
  groupName: string;
  new_name: string;
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

export interface Client {
  client_code:      string;
  user_id?:         string;
  password?:        string;
  api_key?:         string;
  totp_secret?:     string;
  two_fa?:          string;
  is_active:        boolean;
  is_master:        boolean;
  is_authenticated: boolean;
  email?:           string | null;
  phone?:           number | null;
  client_name?:     string;
  broker?:          string;
  account_status?:  string;
  totp_info?: {
    current_totp:       string;
    expires_in_seconds: number;
  };
  last_login?:   { $date: string };
  token_expiry?: { $date: string };
  created_at?:   { $date: string };
  updated_at?:   { $date: string };
  invested_amount?:  number;
  current_value?:    number;
  profit_loss?:      number;
  profit_loss_pct?:  number;
  total_holdings?:   number;
  ltp_warning?:      string;
  available_cash?:     number | null;
  available_for_cash?: number | null;
  available_for_fo?:   number | null;
  cash_balance?:       number | null;
  ledger_balance?:     number | null;
  collateral_value?:   number | null;
  used_margin?:        number | null;
  total_pnl?:          number | null;
  total_available?:    number | null;
  balance_error?:      string;
  holdings?:         HoldingDetail[];
}

export interface ClientsState {
  data:              Record<string, Client>;
  loading:           boolean;
  error:             string | null;
  authenticatingAll: boolean;
  isFetched:         boolean;
}

export type NavPage =
  | 'dashboard'
  | 'clients'
  | 'portfolio'
  | 'bulk-trading'
  | 'trade-history'
  | 'settings'
  | 'order-logs'
  | 'log-export';

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
}



export interface TotpInfo {
  current_totp: string;
  expires_in_seconds: number;
}


export interface ClientsState {
  data: Record<string, Client>;
  loading: boolean;
  error: string | null;
  authenticatingAll: boolean;
  isFetched: boolean, 
}


export interface OrderRequest {
  clientcode: string;
  variety: string;
  tradingsymbol: string;
  symboltoken: string;
  transactiontype: 'BUY' | 'SELL';
  exchange: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: string;
  squareoff: string;
  stoploss: string;
  quantity: number;
  buyorsell?: string;
  selectedClients?: string[];  

}

export interface OrderResponse {
  status: string;
  message: string;
  orderid: string;
  uniqueOrderId: string;
  clientCode?: string;
  clientName?: string;
  traceId?: string;
  requestId?: string;
}

export interface BulkTradeResult {
  [clientCode: string]: OrderResponse;
}

export interface BulkTradeResponse {
  status: string;
  message: string;
  masterClientCode: string;
  masterClientName: string;
  results: BulkTradeResult;
  totalClients: number;
  successCount: number;
  failedCount: number;
  traceId?: string;
}

export interface BulkTradeState {
  loading: boolean;
  error: string | null;
  lastResult: BulkTradeResponse | null;
  selectedClients: string[];
}


export interface TradeLogEntry {
  id?: string;
  clientCode?: string;
  clientName?: string;
  masterClientCode?: string;
  masterClientName?: string;
  action?: string;        
  buyOrSell?: string;      
  symbol?: string;         
  exchange?: string;       
  status?: string;
  uniqueOrderId?: string;
  quantity?: number;
  price?: number;          
  traceId?: string;
  spanId?: string;
  createdAt?: string;
}
export interface TradeHistoryState {
  data: TradeLogEntry[];
  loading: boolean;
  error: string | null;
  isFetched: boolean, 
  filters: {
    type: string;
    clientCode: string;
    startDate: string;
    endDate: string;
  };
}

export interface NavItem {
  id: NavPage;
  label: string;
  icon: string;
}


export interface AccessibleClientsResponse {
  status: string;
  role: string;
  clients: Client[];
  masterClient?: Client;
}

export interface SymbolSearchResult {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  exchange: string;
}

// ─── Store Root ──────────────────────────────────────────────────────────────

export interface RootState {
  clients: ClientsState;
  bulkTrade: BulkTradeState;
  tradeHistory: TradeHistoryState;
}

export interface ClientForm {
  client_code: string;
  user_id: string;
  password: string;
  api_key: string;
  authorization: string;
  totp_secret: string;
  totp_token: string;
  two_fa: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_master: boolean;
}
export interface HoldingDetail {
  name:            string;
  isin:            string;
  quantity:        number;
  avg_price:       number;
  ltp:             number;
  invested_amount: number;
  current_value:   number;
  profit_loss:     number;
  profit_loss_pct: number;
  nse_token:       number;
  bse_token:       number;
}

