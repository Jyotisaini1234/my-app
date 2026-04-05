import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { BROKER_BASE } from '../../../utils/ApiConstants';
import { GroupEntry, CreateGroupPayload, AddRemoveClientsPayload, RenameGroupPayload } from '../../../types/type';


interface GroupsState {
  data:       Record<string, GroupEntry>;
  isLoading:  boolean;
  isFetched:  boolean;
  error:      string | null;
}

const initialState: GroupsState = {
  data:      {},
  isLoading: false,
  isFetched: false,
  error:     null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getHeaders = (state: RootState): HeadersInit => {
  const clientCode = state.auth.user?.clientCode;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (clientCode) headers['X-Client-Code'] = clientCode.toUpperCase();
  return headers;
};

const apiUrl = (path: string) => `${BROKER_BASE}${path}`;

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchGroups = createAsyncThunk<
  Record<string, GroupEntry>,
  void,
  { state: RootState; rejectValue: string }
>('groups/fetchGroups', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await fetch(apiUrl('/api/group/list'), {
      headers: getHeaders(getState()),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'SUCCESS')
      return rejectWithValue(json.message ?? 'Failed to fetch groups');
    return json.groups as Record<string, GroupEntry>;
  } catch (e: any) {
    return rejectWithValue(e.message ?? 'Network error');
  }
});

export const createGroup = createAsyncThunk<
  void,
  CreateGroupPayload,
  { state: RootState; rejectValue: string }
>('groups/createGroup', async (payload, { getState, dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(apiUrl('/api/group/create'), {
      method:  'POST',
      headers: getHeaders(getState()),
      body:    JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'SUCCESS')
      return rejectWithValue(json.message ?? 'Failed to create group');
    dispatch(fetchGroups());
  } catch (e: any) {
    return rejectWithValue(e.message ?? 'Network error');
  }
});

export const addClientsToGroup = createAsyncThunk<
  void,
  AddRemoveClientsPayload,
  { state: RootState; rejectValue: string }
>('groups/addClients', async ({ groupName, client_codes }, { getState, dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(apiUrl(`/api/group/${groupName}/add-clients`), {
      method:  'PATCH',
      headers: getHeaders(getState()),
      body:    JSON.stringify({ client_codes }),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'SUCCESS')
      return rejectWithValue(json.message ?? 'Failed to add clients');
    dispatch(fetchGroups());
  } catch (e: any) {
    return rejectWithValue(e.message ?? 'Network error');
  }
});

export const removeClientsFromGroup = createAsyncThunk<
  void,
  AddRemoveClientsPayload,
  { state: RootState; rejectValue: string }
>('groups/removeClients', async ({ groupName, client_codes }, { getState, dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(apiUrl(`/api/group/${groupName}/remove-clients`), {
      method:  'PATCH',
      headers: getHeaders(getState()),
      body:    JSON.stringify({ client_codes }),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'SUCCESS')
      return rejectWithValue(json.message ?? 'Failed to remove clients');
    dispatch(fetchGroups());
  } catch (e: any) {
    return rejectWithValue(e.message ?? 'Network error');
  }
});

export const renameGroup = createAsyncThunk<
  void,
  RenameGroupPayload,
  { state: RootState; rejectValue: string }
>('groups/renameGroup', async ({ groupName, new_name }, { getState, dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(apiUrl(`/api/group/${groupName}/rename`), {
      method:  'PATCH',
      headers: getHeaders(getState()),
      body:    JSON.stringify({ new_name }),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'SUCCESS')
      return rejectWithValue(json.message ?? 'Failed to rename group');
    dispatch(fetchGroups());
  } catch (e: any) {
    return rejectWithValue(e.message ?? 'Network error');
  }
});

export const deleteGroup = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>('groups/deleteGroup', async (groupName, { getState, rejectWithValue }) => {
  try {
    const res = await fetch(apiUrl(`/api/group/${groupName}`), {
      method:  'DELETE',
      headers: getHeaders(getState()),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'SUCCESS')
      return rejectWithValue(json.message ?? 'Failed to delete group');
    return groupName;
  } catch (e: any) {
    return rejectWithValue(e.message ?? 'Network error');
  }
});

// ── Slice ─────────────────────────────────────────────────────────────────────

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearGroupsError(state) { state.error = null; },
  },
  extraReducers: (builder) => {

    // fetchGroups
    builder
      .addCase(fetchGroups.pending,  (state) => { state.isLoading = true;  state.error = null; })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetched = true;
        state.data      = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload ?? 'Failed to fetch groups';
      });

    // deleteGroup — optimistic remove
    builder
      .addCase(deleteGroup.fulfilled, (state, action: PayloadAction<string>) => {
        delete state.data[action.payload];
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to delete group';
      });

    // createGroup / addClients / removeClients / renameGroup
    // all re-fetch via dispatch(fetchGroups()) on success, so no extra state needed
    const mutationRejected = (state: GroupsState, action: any) => {
      state.error = action.payload ?? 'Operation failed';
    };
    builder
      .addCase(createGroup.rejected,           mutationRejected)
      .addCase(addClientsToGroup.rejected,     mutationRejected)
      .addCase(removeClientsFromGroup.rejected, mutationRejected)
      .addCase(renameGroup.rejected,           mutationRejected);
  },
});

export const { clearGroupsError } = groupsSlice.actions;
export default groupsSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectGroups      = (s: RootState) => s.groups.data;
export const selectGroupsLoading = (s: RootState) => s.groups.isLoading;
export const selectGroupsFetched = (s: RootState) => s.groups.isFetched;
export const selectGroupsError   = (s: RootState) => s.groups.error;