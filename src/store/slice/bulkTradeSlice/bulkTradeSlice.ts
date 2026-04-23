import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BulkTradeState, BulkTradeResponse, OrderRequest } from '../../../types/type';
import { tradeService } from '../../../services/api';

export const placeOrderForAll = createAsyncThunk(
  'bulkTrade/placeOrder',
    async (orderRequest: OrderRequest & Record<string, any>, { rejectWithValue }) => {
    try {
      const invalidClients = orderRequest.selectedClients.filter(c => !c.includes(':'));
      if (invalidClients.length > 0) {
        return rejectWithValue(
          `Invalid selectedClients format: ${invalidClients.join(', ')}. Expected USERID:BROKER`
        );
      }
      return (await tradeService.placeOrder(orderRequest)) as unknown as BulkTradeResponse;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const cancelOrderForAll = createAsyncThunk(
  'bulkTrade/cancelOrder',
  async (uniqueorderid: string, { rejectWithValue }) => {
    try {
      return await tradeService.cancelOrder(uniqueorderid);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState: BulkTradeState = {
  loading:         false,
  error:           null,
  lastResult:      null,
  selectedClients: [],
};

const bulkTradeSlice = createSlice({
  name: 'bulkTrade',
  initialState,
  reducers: {
    setSelectedClients(state, action: PayloadAction<string[]>) {
      state.selectedClients = action.payload;
    },
    toggleSelectedClient(state, action: PayloadAction<string>) {
      const idx = state.selectedClients.indexOf(action.payload);
      if (idx === -1) state.selectedClients.push(action.payload);
      else            state.selectedClients.splice(idx, 1);
    },
    // ✅ NEW: component mount pe call karo stale selections clear karne ke liye
    clearSelectedClients(state) {
      state.selectedClients = [];
    },
    clearResult(state) {
      state.lastResult = null;
      state.error      = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrderForAll.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(placeOrderForAll.fulfilled, (state, action) => { state.loading = false; state.lastResult = action.payload; })
      .addCase(placeOrderForAll.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; });

    builder
      .addCase(cancelOrderForAll.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(cancelOrderForAll.fulfilled, (state)         => { state.loading = false; })
      .addCase(cancelOrderForAll.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const {
  setSelectedClients,
  toggleSelectedClient,
  clearSelectedClients,
  clearResult,
  clearError,
} = bulkTradeSlice.actions;

export default bulkTradeSlice.reducer;