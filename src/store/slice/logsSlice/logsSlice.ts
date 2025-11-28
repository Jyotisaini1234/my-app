// src/store/slice/logsSlice/logsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, Draft } from '@reduxjs/toolkit';
import { logsService } from '../../../api/logsService';
import { TradeLog, TimelineResponse } from '../../../types/type';
import { TimelineFilters } from '../../../types/type';

interface LogsState {
  logs: TradeLog[];
  timeline: TimelineResponse | null;
  loading: boolean;
  traceLogsData: any | null;
  spanLogsData: any | null;
  error: string | null;
}

const initialState: LogsState = {
  logs: [],
  timeline: null,
  traceLogsData: null,
  spanLogsData: null,
  loading: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

export const fetchLogsByRequest = createAsyncThunk(
  'logs/byRequest',
  async (requestId: string) => {
    return await logsService.byRequest(requestId);
  }
);

export const fetchLogsByTrace = createAsyncThunk(
  'logs/byTrace',
  async ({ traceId, startDate, endDate }: { traceId: string; startDate?: string; endDate?: string }) => {
    const response = await logsService.byTrace(traceId, startDate, endDate);
    return response;
  }
);

export const fetchLogsBySpan = createAsyncThunk(
  'logs/bySpan',
  async (spanId: string) => {
    const response = await logsService.bySpan(spanId);
    return response;
  }
);

export const fetchLogsByClient = createAsyncThunk(
  'logs/byClient',
  async ({ 
    clientCode, 
    startDate, 
    endDate, 
    hours 
  }: { 
    clientCode: string; 
    startDate?: string; 
    endDate?: string;
    hours?: number;
  }) => {
    return await logsService.byClient(clientCode, startDate, endDate, hours);
  }
);

export const fetchLogsByClientName = createAsyncThunk(
  'logs/byClientName',
  async ({ 
    clientName, 
    hours, 
    startDate, 
    endDate 
  }: { 
    clientName: string; 
    hours?: number; 
    startDate?: string; 
    endDate?: string;
  }) => {
    return await logsService.byClientName(clientName, hours, startDate, endDate);
  }
);

export const fetchLogsByClientGrouped = createAsyncThunk(
  'logs/byClientGrouped',
  async ({ 
    clientCode, 
    hours, 
    startDate, 
    endDate 
  }: { 
    clientCode: string; 
    hours?: number; 
    startDate?: string; 
    endDate?: string;
  }) => {
    return await logsService.byClientGrouped(clientCode, hours, startDate, endDate);
  }
);

export const fetchLogsByEndpoint = createAsyncThunk(
  'logs/byEndpoint',
  async (endpoint: string) => {
    return await logsService.byEndpoint(endpoint);
  }
);

export const fetchLogsByStatus = createAsyncThunk(
  'logs/byStatus',
  async (status: string) => {
    return await logsService.byStatus(status);
  }
);

/**
 * Main timeline/data fetcher - uses /api/logs/data/all endpoint
 * Supports filters: clientCode, startDate (dd-MM-yyyy), endDate (dd-MM-yyyy), status, action
 */
export const fetchTimeline = createAsyncThunk(
  'logs/timeline',
  async (filters?: TimelineFilters) => {
    console.log('🚀 Fetching timeline with filters:', filters);
    return await logsService.getAllData(filters);
  }
);

/**
 * Get request count with optional data
 */
export const fetchRequestCount = createAsyncThunk(
  'logs/requestCount',
  async ({ 
    startDate, 
    endDate, 
    clientCode, 
    includeData 
  }: { 
    startDate: string; 
    endDate: string; 
    clientCode?: string; 
    includeData?: boolean;
  }) => {
    return await logsService.getRequestCount(startDate, endDate, clientCode, includeData);
  }
);

export const fetchStats = createAsyncThunk(
  'logs/stats',
  async (endpoint: string) => {
    return await logsService.stats(endpoint);
  }
);

// ==================== SLICE ====================

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLogs: (state) => {
      state.logs = [];
      state.timeline = null;
    },
    clearSpanLogs: (state) => {
      state.spanLogsData = null;
    },
    clearTraceLogsData: (state) => {
      state.traceLogsData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== TIMELINE ====================
      .addCase(fetchTimeline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeline.fulfilled, (state, action: PayloadAction<TimelineResponse>) => {
        state.loading = false;
        state.timeline = action.payload;
        console.log('✅ Timeline updated:', action.payload);
      })
      .addCase(fetchTimeline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch timeline';
        console.error('❌ Timeline fetch failed:', action.error);
      })
      
      // ==================== TRACE LOGS ====================
      .addCase(fetchLogsByTrace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogsByTrace.fulfilled, (state, action) => {
        state.loading = false;
        state.traceLogsData = action.payload as any;
        
        if (action.payload?.logs && Array.isArray(action.payload.logs)) {
          state.logs = action.payload.logs as Draft<TradeLog[]>;
        } else if (action.payload?.lokiLogs && Array.isArray(action.payload.lokiLogs)) {
          state.logs = action.payload.lokiLogs as Draft<TradeLog[]>;
        } else {
          state.logs = [];
        }
        console.log('✅ Trace logs updated');
      })
      .addCase(fetchLogsByTrace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch trace logs';
        console.error('❌ Trace logs fetch failed:', action.error);
      })

      // ==================== SPAN LOGS ====================
      .addCase(fetchLogsBySpan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogsBySpan.fulfilled, (state, action) => {
        state.loading = false;
        state.spanLogsData = action.payload as any;
        console.log('✅ Span logs updated');
      })
      .addCase(fetchLogsBySpan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch span logs';
        console.error('❌ Span logs fetch failed:', action.error);
      })

      // ==================== REQUEST COUNT ====================
      .addCase(fetchRequestCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequestCount.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ Request count fetched:', action.payload);
      })
      .addCase(fetchRequestCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch request count';
        console.error('❌ Request count fetch failed:', action.error);
      })

      // ==================== GENERIC MATCHERS ====================
      .addMatcher(
        (action) => action.type.startsWith('logs/') && action.type.endsWith('/fulfilled') && 
                   !['logs/byTrace/fulfilled', 'logs/bySpan/fulfilled', 'logs/timeline/fulfilled', 'logs/requestCount/fulfilled'].includes(action.type),
        (state, action: any) => {
          state.loading = false;
          if (action.payload?.logs) {
            state.logs = action.payload.logs;
          }
        }
      )
      
      .addMatcher(
        (action) => action.type.startsWith('logs/') && action.type.endsWith('/pending') && 
                   !['logs/byTrace/pending', 'logs/bySpan/pending', 'logs/timeline/pending', 'logs/requestCount/pending'].includes(action.type),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      
      .addMatcher(
        (action) => action.type.startsWith('logs/') && action.type.endsWith('/rejected') && 
                   !['logs/byTrace/rejected', 'logs/bySpan/rejected', 'logs/timeline/rejected', 'logs/requestCount/rejected'].includes(action.type),
        (state, action: any) => {
          state.loading = false;
          state.error = action.error?.message || 'Failed to fetch logs';
        }
      );
  },
});

export const { clearError, clearLogs, clearSpanLogs, clearTraceLogsData } = logsSlice.actions;
export default logsSlice.reducer;