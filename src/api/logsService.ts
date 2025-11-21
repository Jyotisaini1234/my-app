import { LogsResponse, TimelineResponse } from '../types/type';
import { TimelineFilters } from '../types/type';
import { API_CONFIG, ENDPOINTS } from './config';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const logsService = {
  byRequest: (requestId: string) =>
    request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_REQUEST(requestId)}`),
  
  byTrace: (traceId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params}` : '';
    return request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_TRACE(traceId)}${query}`);
  },
  
  byClient: (clientCode: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params}` : '';
    return request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_CLIENT(clientCode)}${query}`);
  },
  
  byEndpoint: (endpoint: string) => {
    const params = new URLSearchParams({ endpoint });
    return request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_ENDPOINT}?${params}`);
  },
  
  byStatus: (status: string) =>
    request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_STATUS(status)}`),
  
 timeline: (filters?: TimelineFilters) => {
  const params = new URLSearchParams();

  if (filters?.clientCode) params.append('clientCode', filters.clientCode);
  if (filters?.endpoint) params.append('endpoint', filters.endpoint);
  if (filters?.status) params.append('status', filters.status); // ✅ new
  if (filters?.requestType) params.append('requestType', filters.requestType); // ✅ new
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const query = params.toString() ? `?${params}` : '';
  return request<TimelineResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_TIMELINE}${query}`);
},

  stats: (endpoint: string) =>
    request(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_STATS(endpoint)}`),
};
