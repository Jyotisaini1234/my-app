/**
 * bulkTradeSlice.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles ALL order operations (bulk place, bulk cancel).
 * Replaces the old tradeSlice, ordersSlice, and bulkTradeSlice.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BulkTradeState, BulkTradeResponse, OrderRequest } from '../../../types/type';
import { tradeService } from '../../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const placeOrderForAll = createAsyncThunk(
  'bulkTrade/placeOrder',
  async (orderRequest: OrderRequest, { rejectWithValue }) => {
    try {
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

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: BulkTradeState = {
  loading: false,
  error: null,
  lastResult: null,
  selectedClients: [],
};

// ─── Slice ────────────────────────────────────────────────────────────────────

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
    clearResult(state) {
      state.lastResult = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrderForAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrderForAll.fulfilled, (state, action) => {
        state.loading = false;
        state.lastResult = action.payload;
      })
      .addCase(placeOrderForAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(cancelOrderForAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrderForAll.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(cancelOrderForAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedClients, toggleSelectedClient, clearResult, clearError } =
  bulkTradeSlice.actions;
export default bulkTradeSlice.reducer;