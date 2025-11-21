import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { clientService } from '../../../api/clientService';
import { Client, NewClientData } from '../../../types/type';

interface ClientsState {
  data: Record<string, Client>;
  loading: boolean;
  error: string | null;
}

const initialState: ClientsState = {
  data: {},
  loading: false,
  error: null,
};

export const fetchClients = createAsyncThunk('clients/fetch', async () => {
  return await clientService.list();
});

export const addClient = createAsyncThunk('clients/add', async (data: NewClientData) => {
  return await clientService.add(data);
});

export const deleteClient = createAsyncThunk('clients/delete', async (code: string) => {
  await clientService.delete(code);
  return code;
});

export const authenticateClient = createAsyncThunk('clients/auth', async (code: string) => {
  return await clientService.authenticate(code);
});

export const authenticateAllClients = createAsyncThunk('clients/authAll', async () => {
  return await clientService.authenticateAll();
});

export const logoutClient = createAsyncThunk('clients/logout', async (code: string) => {
  await clientService.logout(code);
  return code;
});

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'SUCCESS') {
          state.data = action.payload.clients;
        }
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch clients';
      })
      .addCase(deleteClient.fulfilled, (state, action: PayloadAction<string>) => {
        delete state.data[action.payload];
      });
  },
});

export const { clearError } = clientsSlice.actions;
export default clientsSlice.reducer;

