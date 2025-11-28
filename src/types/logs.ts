export interface Client {
  clientCode: string;
  apiKey: string;
  secretKey: string;
  totp: string;
  isAuthenticated: boolean;
}

export interface NewClientData {
  clientCode: string;
  apiKey: string;
  secretKey: string;
  totp: string;
}
export interface LokiLog {
  id?: number;
  client_code?: string;
  clientCode?: string;
  client_name?: string;
  clientName?: string;
  trace_id?: string;
  traceId?: string;
  request_id?: string;
  requestId?: string;
  span_id?: string;
  spanId?: string;
  unique_order_id?: string;
  action?: string;
  status?: string;
  created_at?: { $date: string } | string | Date;
  createdAt?: string | Date;
  requestTime?: string | Date;
  timestamp?: number | string | Date;
  level?: string;
  message?: string;
  thread?: string;
  logger?: string;
  timestampReadable?: string;
}

export interface LogsModalProps {
  traceId: string;
  lokiLogs: LokiLog[];
  grafanaUrl?: string;
  loading: boolean;
  onClose: () => void;
  fullData?: any;
}
