import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { OrderRequest } from '../../../types/type';
import { tradeService } from '../../../services/api';

interface TradeState {
  loading: boolean;
  error: string | null;
  lastOrder: any;
}

const initialState: TradeState = {
  loading: false,
  error: null,
  lastOrder: null,
};

export const placeOrder = createAsyncThunk('trade/place', async (data: OrderRequest) => {
  return await tradeService.placeOrder(data);
});

export const cancelOrder = createAsyncThunk('trade/cancel', async (orderId: string) => {
  return await tradeService.cancelOrder(orderId);
});

const tradeSlice = createSlice({
  name: 'trades',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.lastOrder = action.payload;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to place order';
      });
  },
});

export const { clearError } = tradeSlice.actions;
export default tradeSlice.reducer;

