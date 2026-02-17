import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Client, ClientsState } from '../../../types/type';
import { clientService } from '../../../services/clientService';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await clientService.list();
      return res.clients as Record<string, Client>;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchActiveClients = createAsyncThunk(
  'clients/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const res = await clientService.listActive();
      return res.clients as Record<string, Client>;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const addClient = createAsyncThunk(
  'clients/add',
  async (
    data: {
      clientCode: string;
      userId: string;
      password: string;
      apiKey: string;
      totpSecret?: string;
      twoFa?: string;
      active?: boolean;
      master?: boolean;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await clientService.add(data);
      dispatch(fetchClients());
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const authenticateClient = createAsyncThunk(
  'clients/authenticate',
  async (clientCode: string, { rejectWithValue, dispatch }) => {
    try {
      await clientService.authenticate(clientCode);
      dispatch(fetchClients());
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const authenticateAllClients = createAsyncThunk(
  'clients/authenticateAll',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await clientService.authenticateAll();
      dispatch(fetchClients());
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (clientCode: string, { rejectWithValue, dispatch }) => {
    try {
      await clientService.delete(clientCode);
      dispatch(fetchClients());
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: ClientsState = {
  data: {},
  loading: false,
  error: null,
  authenticatingAll: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchClients
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action: PayloadAction<Record<string, Client>>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchActiveClients
    builder
      .addCase(fetchActiveClients.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveClients.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchActiveClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // addClient
    builder
      .addCase(addClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addClient.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // authenticateAllClients
    builder
      .addCase(authenticateAllClients.pending, (state) => {
        state.authenticatingAll = true;
        state.error = null;
      })
      .addCase(authenticateAllClients.fulfilled, (state) => {
        state.authenticatingAll = false;
      })
      .addCase(authenticateAllClients.rejected, (state, action) => {
        state.authenticatingAll = false;
        state.error = action.payload as string;
      });

    // authenticateClient
    builder
      .addCase(authenticateClient.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // deleteClient
    builder
      .addCase(deleteClient.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = clientsSlice.actions;
export default clientsSlice.reducer;