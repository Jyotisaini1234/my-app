import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Client, ClientsState } from '../../../types/type';
import { clientService } from '../../../services/api';
import { RootState } from '../../store';
import { BROKER_BASE } from '../../../utils/ApiConstants';

const toClientMap = (input: Client[] | Record<string, Client>): Record<string, Client> => {
  const raw: Client[] = Array.isArray(input) ? input : Object.values(input ?? {});
  
  return raw.reduce((acc, c) => {
    if (!c.client_code) return acc;
    const brokers = (c as any).brokers ?? {};
    const isAuth = Object.values(brokers).some(
      (b: any) => b?.is_authenticated === true
    );
    
    acc[c.client_code] = {
      ...c,
      is_authenticated: isAuth,
      is_active: c.is_active ?? (c as any).isActive ?? false,
    };
    return acc;
  }, {} as Record<string, Client>);
};
const fetchEnrichedClient = async (clientCode: string): Promise<Client> => {
  const url = `${BROKER_BASE}/api/client/details/${clientCode.trim().toUpperCase()}/enriched`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Enriched fetch failed: ${res.status} — ${text}`);
  }
  const json = await res.json();
  const client = (json?.data ?? json) as any;

  const brokers = client.brokers ?? {};
  const isAuth = Object.values(brokers).some((b: any) => b?.is_authenticated === true);

  return {
    ...client,
    is_authenticated: isAuth,
    is_active: client.is_active ?? client.isActive ?? false,
  } as Client;
};

export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const user  = state.auth.user;
      if (user && user.role !== 'MASTER') {
        const clientCode = user.clientCode || user.id;
        if (!clientCode) return rejectWithValue('No client code linked to your account.');
        const clientData = await fetchEnrichedClient(clientCode);
        return { [clientCode]: clientData } as Record<string, Client>;
      }
      const res = await clientService.list();
      return toClientMap(res.clients);

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
        const clientCode = user.clientCode || user.id;
        if (!clientCode) return rejectWithValue('No client code linked to your account.');
        const clientData = await fetchEnrichedClient(clientCode);
        return { [clientCode]: clientData } as Record<string, Client>;
      }

      const res = await clientService.listActive();
      return toClientMap(res.clients);
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

// ── Update client (broker upsert) ─────────────────────────────────────────────
export const updateClient = createAsyncThunk(
  'clients/update',
  async (
    { clientCode, body }: { clientCode: string; body: Record<string, any> },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await fetch(`${BROKER_BASE}/api/client/update/${clientCode}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(body),
      });

      const data = await res.json();
      if (data.status !== 'SUCCESS') {
        return rejectWithValue(data.message ?? 'Update failed');
      }

      dispatch(fetchClients()); // refresh list after update
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Network error');
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
    resetClients(state) {
      state.data      = {};
      state.isFetched = false;
      state.error     = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClients.fulfilled, (state, action: PayloadAction<Record<string, Client>>) => {
        state.loading   = false;
        state.isFetched = true;
        state.data      = action.payload;
      })
      .addCase(fetchClients.rejected,  (state, action) => {
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
      .addCase(addClient.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    builder
      .addCase(authenticateAllClients.pending,   (state) => { state.authenticatingAll = true; state.error = null; })
      .addCase(authenticateAllClients.fulfilled, (state) => { state.authenticatingAll = false; })
      .addCase(authenticateAllClients.rejected,  (state, action) => {
        state.authenticatingAll = false;
        state.error             = action.payload as string;
      });

    builder.addCase(authenticateClient.rejected, (state, action) => { state.error = action.payload as string; });
    builder.addCase(deleteClient.rejected,        (state, action) => { state.error = action.payload as string; });
    builder
  .addCase(updateClient.pending,   (state) => { state.loading = true;  state.error = null; })
  .addCase(updateClient.fulfilled, (state) => { state.loading = false; })
  .addCase(updateClient.rejected,  (state, action) => {
    state.loading = false;
    state.error   = action.payload as string;
  });
  },
});

export const { clearError, resetClients } = clientsSlice.actions;
export default clientsSlice.reducer;