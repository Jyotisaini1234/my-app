import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TradeHistoryState, TradeLogEntry } from '../../../types/type';
import { logService, clientService } from '../../../services/api';
import { RootState } from '../../store';

type TradeFilters = {
  startDate?: string;
  endDate?: string;
  clientCode?: string;
};

export const fetchTradeHistory = createAsyncThunk<TradeLogEntry[], TradeFilters>(
  'tradeHistory/fetchAll',
  async (filters, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const user  = state.auth.user;

      if (user && user.role !== 'MASTER') {
        const userCode = user.id || user.clientCode;
        if (!userCode) return rejectWithValue('No client code linked to your account.');
        const res: any = await logService.getAllData({ ...filters, clientCode: userCode });
        return (res.data || []) as TradeLogEntry[];
      }

      const inputCode = filters.clientCode?.trim().toUpperCase();
      if (inputCode) {
        try { await clientService.details(inputCode); } catch {
          return rejectWithValue(`Client code "${inputCode}" not found.`);
        }
        const res: any = await logService.getAllData({ ...filters, clientCode: inputCode });
        return (res.data || []) as TradeLogEntry[];
      }

      const res: any = await logService.getAllData(filters);
      return (res.data || []) as TradeLogEntry[];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTradeCount = createAsyncThunk(
  'tradeHistory/fetchCount',
  async (params: { startDate: string; endDate: string; clientCode?: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const user  = state.auth.user;
      if (user && user.role !== 'MASTER') {
        const userCode = user.id || user.clientCode;
        if (!userCode) return rejectWithValue('No client code linked to your account.');
        return await logService.getCount(params.startDate, params.endDate, userCode);
      }
      return await logService.getCount(params.startDate, params.endDate, params.clientCode?.trim().toUpperCase());
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState: TradeHistoryState = {
  data: [],
  loading: false,
  error: null,
  isFetched: false,
  filters: { type: 'All', clientCode: '', startDate: '', endDate: '' },
};

const tradeHistorySlice = createSlice({
  name: 'tradeHistory',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<TradeHistoryState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) { state.filters = initialState.filters; },
    clearError(state)   { state.error = null; },
    // ✅ Logout ya user switch pe data reset
    resetTradeHistory(state) {
      state.data      = [];
      state.isFetched = false;
      state.error     = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTradeHistory.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTradeHistory.fulfilled, (state, action) => { state.loading = false; state.isFetched = true; state.data = action.payload; })
      .addCase(fetchTradeHistory.rejected,  (state, action) => { state.loading = false; state.isFetched = true; state.error = action.payload as string; state.data = []; });
  },
});

export const { setFilters, clearFilters, clearError, resetTradeHistory } = tradeHistorySlice.actions;
export default tradeHistorySlice.reducer;