import { LogsResponse, TimelineResponse, TradeLog } from '../types/type';
import { TimelineFilters } from '../types/type';
import { API_CONFIG, ENDPOINTS } from '../utils/ApiConstants';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const logsService = {

  byTrace: (traceId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params}` : '';
    return request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_TRACE(traceId)}${query}`);
  },

  bySpan: (spanId: string) => 
    request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_SPAN(spanId)}`),
  

  byTraceAndSpan: (traceId: string, spanId: string) =>
    request<LogsResponse>(`${API_CONFIG.TRADE}/api/logs/trace/${traceId}/span/${spanId}`),


  byClient: (clientCode: string, startDate?: string, endDate?: string, hours?: number) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (hours) params.append('hours', String(hours));
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_CLIENT(clientCode)}${query}`);
  },
  

  byClientName: (clientName: string, hours?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (hours) params.append('hours', String(hours));
    const query = params.toString() ? `?${params}` : '';
    return request<LogsResponse>(`${API_CONFIG.TRADE}/api/logs/client-name/${encodeURIComponent(clientName)}${query}`);
  },
  

  byClientGrouped: (clientCode: string, hours?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (hours) params.append('hours', String(hours));
    const query = params.toString() ? `?${params}` : '';
    return request<any>(`${API_CONFIG.TRADE}/api/logs/client/${clientCode}/grouped${query}`);
  },

  getAllData: async (filters?: {
    startDate?: string;
    endDate?: string;
    clientCode?: string;
    status?: string;
    action?: string;
  }): Promise<TimelineResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.clientCode?.trim()) {
          params.append('clientCode', filters.clientCode.trim());
        }
        if (filters.startDate) {
          params.append('startDate', filters.startDate);
        }
        if (filters.endDate) {
          params.append('endDate', filters.endDate);
        }
        if (filters.status) {
          params.append('status', filters.status);
        }
        if (filters.action) {
          params.append('action', filters.action);
        }
      }
      
      const queryString = params.toString();
      const url = `${API_CONFIG.TRADE}/api/logs/data/all${queryString ? `?${queryString}` : ''}`;
      
      console.log('📡 API Request URL:', url);
      console.log('📋 Query Params:', Object.fromEntries(params.entries()));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 API Response:', result);
      
      let allLogs: TradeLog[] = result.data || [];
      
      allLogs.sort((a, b) => {
        if (!a.createdAt && !a.requestTime) return 1;
        if (!b.createdAt && !b.requestTime) return -1;
        const dateA = new Date(a.createdAt || a.requestTime || 0);
        const dateB = new Date(b.createdAt || b.requestTime || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      const successCount = allLogs.filter(log => 
        log.status?.toUpperCase() === 'SUCCESS'
      ).length;
      
      const errorCount = allLogs.filter(log => 
        log.status?.toUpperCase() === 'ERROR'
      ).length;
      
      const partialCount = allLogs.filter(log => 
        log.status?.toUpperCase() === 'PARTIAL'
      ).length;
      
      return {
        status: result.status || 'SUCCESS',
        totalLogs: result.totalRecords || allLogs.length,
        timeline: allLogs,
        statistics: {
          successCount,
          errorCount,
          partialCount,
          totalCount: allLogs.length
        }
      };
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      throw error;
    }
  },
  

  getRequestCount: async (
    startDate: string,
    endDate: string,
    clientCode?: string,
    includeData: boolean = false
  ) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      includeData: String(includeData)
    });
    
    if (clientCode) {
      params.append('clientCode', clientCode);
    }
    
    const url = `${API_CONFIG.TRADE}/api/logs/data/count?${params}`;
    console.log('📊 Request Count URL:', url);
    
    return request<any>(url);
  },

  byRequest: (requestId: string) =>
    request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_REQUEST(requestId)}`),
  
  byEndpoint: (endpoint: string) => {
    const params = new URLSearchParams({ endpoint });
    return request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_ENDPOINT}?${params}`);
  },
  
  byStatus: (status: string) =>
    request<LogsResponse>(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_STATUS(status)}`),
  
  stats: (endpoint: string) =>
    request(`${API_CONFIG.TRADE}${ENDPOINTS.LOGS_STATS(endpoint)}`),

  timeline: async (filters?: TimelineFilters): Promise<TimelineResponse> => {
    return logsService.getAllData(filters);
  }
};