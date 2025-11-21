
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../../services/api.service';
import { OrderRequest } from '../../../types/type';


interface OrdersState {
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  loading: false,
  error: null
};

export const placeOrder = createAsyncThunk('orders/place', 
  async (data: OrderRequest) => apiService.placeOrder(data)
);
export const placeSingleOrder = createAsyncThunk('orders/placeSingle', 
  async (data: OrderRequest) => apiService.placeSingleOrder(data)
);
export const cancelOrder = createAsyncThunk('orders/cancel', 
  async (uniqueorderid: string) => apiService.cancelOrder(uniqueorderid)
);
export const cancelSingleOrder = createAsyncThunk('orders/cancelSingle', 
  async (data: { clientcode: string; uniqueorderid: string }) => 
    apiService.cancelSingleOrder(data)
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to place order';
      });
  }
});

export const { clearError } = ordersSlice.actions;
export default ordersSlice.reducer;
