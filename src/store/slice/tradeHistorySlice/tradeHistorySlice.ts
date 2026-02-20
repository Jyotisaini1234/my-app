import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TradeHistoryState, TradeLogEntry } from '../../../types/type';
import { logService } from '../../../services/api';


type TradeFilters = {
  startDate?: string;
  endDate?: string;
  clientCode?: string;
};

export const fetchTradeHistory = createAsyncThunk<TradeLogEntry[], TradeFilters>(
  'tradeHistory/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const res: any = await logService.getAllData(filters);
      return (res.data || []) as TradeLogEntry[];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTradeCount = createAsyncThunk(
  'tradeHistory/fetchCount',
  async (
    params: { startDate: string; endDate: string; clientCode?: string },
    { rejectWithValue }
  ) => {
    try {
      return await logService.getCount(params.startDate, params.endDate, params.clientCode);
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
  filters: {
    type: 'All',
    clientCode: '',
    startDate: '',
    endDate: '',
  },
};


const tradeHistorySlice = createSlice({
  name: 'tradeHistory',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<TradeHistoryState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = initialState.filters;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTradeHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradeHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.isFetched = true;
        state.data = action.payload;
      })
      .addCase(fetchTradeHistory.rejected, (state, action) => {
        state.loading = false;
        state.isFetched = true;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearError } = tradeHistorySlice.actions;
export default tradeHistorySlice.reducer;