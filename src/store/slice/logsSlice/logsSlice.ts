import { createSlice, createAsyncThunk, PayloadAction, Draft } from '@reduxjs/toolkit';
import { logsService } from '../../../api/logsService';
import { TradeLog, TimelineResponse, LogsResponse } from '../../../types/type';
import { TimelineFilters } from '../../../types/type';

interface LogsState {
  logs: TradeLog[];
  timeline: TimelineResponse | null;
  loading: boolean;
  traceLogsData: LogsResponse | null;
  error: string | null;
}

const initialState: LogsState = {
  logs: [],
  timeline: null,
  traceLogsData: null,
  loading: false,
  error: null,
};

export const fetchLogsByRequest = createAsyncThunk(
  'logs/byRequest',
  async (requestId: string) => {
    return await logsService.byRequest(requestId);
  }
);

export const fetchLogsByTrace = createAsyncThunk(
  'logs/byTrace',
  async ({ traceId, startDate, endDate }: { traceId: string; startDate?: string; endDate?: string }) => {
    return await logsService.byTrace(traceId, startDate, endDate);
  }
);

export const fetchLogsByClient = createAsyncThunk(
  'logs/byClient',
  async ({ clientCode, startDate, endDate }: { clientCode: string; startDate?: string; endDate?: string }) => {
    return await logsService.byClient(clientCode, startDate, endDate);
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

export const fetchTimeline = createAsyncThunk(
  'logs/data/all',
  async (filters?: TimelineFilters) => {
    return await logsService.timeline(filters);
  }
);

export const fetchStats = createAsyncThunk(
  'logs/stats',
  async (endpoint: string) => {
    return await logsService.stats(endpoint);
  }
);

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
  },
  extraReducers: (builder) => {
    builder
      // Timeline cases
      .addCase(fetchTimeline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeline.fulfilled, (state, action: PayloadAction<TimelineResponse>) => {
        state.loading = false;
        state.timeline = action.payload;
      })
      .addCase(fetchTimeline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch timeline';
      })
      
      // Trace logs specific case
      .addCase(fetchLogsByTrace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogsByTrace.fulfilled, (state, action) => {
        state.loading = false;
        // Use type assertion to handle Immer's WritableDraft
        state.traceLogsData = action.payload as Draft<LogsResponse>;
        if (action.payload?.logs) {
          state.logs = action.payload.logs as Draft<TradeLog[]>;
        }
      })
      .addCase(fetchLogsByTrace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch trace logs';
      })

      // Generic matcher for all other fulfilled log actions
      .addMatcher(
        (action) => action.type.startsWith('logs/') && action.type.endsWith('/fulfilled') && action.type !== 'logs/byTrace/fulfilled' && action.type !== 'logs/timeline/fulfilled',
        (state, action: any) => {
          state.loading = false;
          if (action.payload?.logs) {
            state.logs = action.payload.logs;
          }
        }
      )
      
      // Generic matcher for all pending log actions
      .addMatcher(
        (action) => action.type.startsWith('logs/') && action.type.endsWith('/pending') && action.type !== 'logs/byTrace/pending' && action.type !== 'logs/timeline/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      
      // Generic matcher for all rejected log actions
      .addMatcher(
        (action) => action.type.startsWith('logs/') && action.type.endsWith('/rejected') && action.type !== 'logs/byTrace/rejected' && action.type !== 'logs/timeline/rejected',
        (state, action: any) => {
          state.loading = false;
          state.error = action.error?.message || 'Failed to fetch logs';
        }
      );
  },
});

export const { clearError, clearLogs } = logsSlice.actions;
export default logsSlice.reducer;