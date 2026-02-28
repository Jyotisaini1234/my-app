import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Client, ClientsState } from '../../../types/type';
import { clientService } from '../../../services/api';
import { RootState } from '../../store';

export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const user  = state.auth.user;

      // ✅ USER role — sirf apna data
      if (user && user.role !== 'MASTER') {
        const clientCode = user.id || user.clientCode;
        if (!clientCode) return rejectWithValue('No client code linked to your account.');
        const res = await clientService.details(clientCode);
        const clientData = res?.data ?? res;
        return { [clientCode]: clientData } as Record<string, Client>;
      }

      // ✅ MASTER — sabka data
      const res = await clientService.list();
      return res.clients as Record<string, Client>;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchActiveClients = createAsyncThunk(
  'clients/fetchActive',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const user  = state.auth.user;

      if (user && user.role !== 'MASTER') {
        const clientCode = user.id || user.clientCode;
        if (!clientCode) return rejectWithValue('No client code linked to your account.');
        const res = await clientService.details(clientCode);
        const clientData = res?.data ?? res;
        return { [clientCode]: clientData } as Record<string, Client>;
      }

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
      clientCode: string; userId: string; password: string; apiKey: string;
      totpSecret?: string; twoFa?: string; active?: boolean; master?: boolean;
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

const initialState: ClientsState = {
  data: {},
  loading: false,
  error: null,
  authenticatingAll: false,
  isFetched: false,
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    // ✅ Logout ya user switch pe data reset karo
    resetClients(state) {
      state.data      = {};
      state.isFetched = false;
      state.error     = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClients.fulfilled,  (state, action: PayloadAction<Record<string, Client>>) => {
        state.loading   = false;
        state.isFetched = true;
        state.data      = action.payload;
      })
      .addCase(fetchClients.rejected,   (state, action) => {
        state.loading   = false;
        state.isFetched = true;
        state.error     = action.payload as string;
      });

    builder
      .addCase(fetchActiveClients.pending,   (state) => { state.loading = true; })
      .addCase(fetchActiveClients.fulfilled, (state, action) => {
        state.loading   = false;
        state.isFetched = true;
        state.data      = action.payload;
      })
      .addCase(fetchActiveClients.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    builder
      .addCase(addClient.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(addClient.fulfilled, (state) => { state.loading = false; })
      .addCase(addClient.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; });

    builder
      .addCase(authenticateAllClients.pending,   (state) => { state.authenticatingAll = true; state.error = null; })
      .addCase(authenticateAllClients.fulfilled, (state) => { state.authenticatingAll = false; })
      .addCase(authenticateAllClients.rejected,  (state, action) => {
        state.authenticatingAll = false;
        state.error             = action.payload as string;
      });

    builder.addCase(authenticateClient.rejected, (state, action) => { state.error = action.payload as string; });
    builder.addCase(deleteClient.rejected,        (state, action) => { state.error = action.payload as string; });
  },
});

export const { clearError, resetClients } = clientsSlice.actions;
export default clientsSlice.reducer;