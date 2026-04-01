import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TRADE_BASE } from '../../../utils/ApiConstants';
import { ArchiveFile, LokiStatus } from '../../../types/logs';

const BASE_URL = `${TRADE_BASE}/api/logs/export`;



interface LogExportState {
  files: ArchiveFile[];
  lokiStatus: LokiStatus | null;
  totalSize: string;
  isFetched: boolean;
  loadingList: boolean;
  loadingStatus: boolean;
  actionTarget: string | null;
  actionType: 'download' | 'delete' | 'upload' | 'restore' | null;
  error: string | null;
}

const initialState: LogExportState = {
  files: [],
  lokiStatus: null,
  totalSize: '0 B',
  isFetched: false,
  loadingList: false,
  loadingStatus: false,
  actionTarget: null,
  actionType: null,
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchArchiveList = createAsyncThunk(
  'logExport/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${BASE_URL}/list-remote`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
      return { files: data.files || [], totalSize: data.totalSize || '0 B' };
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchLokiStatus = createAsyncThunk(
  'logExport/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${BASE_URL}/loki-data-status`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
      return data as LokiStatus;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const downloadArchive = createAsyncThunk(
  'logExport/download',
  async (filename: string, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${BASE_URL}/download-remote/${encodeURIComponent(filename)}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return filename;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const deleteArchive = createAsyncThunk(
  'logExport/delete',
  async (
    { filename, purgeLoki = true }: { filename: string; purgeLoki?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        `${BASE_URL}/delete-remote/${encodeURIComponent(filename)}?purgeLoki=${purgeLoki}`,
        { credentials: 'include', method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      return { filename, lokiPurge: json.lokiPurge };
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const uploadArchive = createAsyncThunk(
  'logExport/upload',
  async (file: File, { rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch(`${BASE_URL}/upload-archive`, {
        method: 'POST', credentials: 'include', body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Upload failed');
      return {
        filename:     file.name,
        size:         json.uploadedSize || '',
        lastModified: new Date().toISOString(),
      } as ArchiveFile;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const restoreArchive = createAsyncThunk(
  'logExport/restore',
  async (filename: string, { rejectWithValue }) => {
    try {
      const res  = await fetch(
        `${BASE_URL}/restore-archive/${encodeURIComponent(filename)}`,
        { method: 'POST', credentials: 'include' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      return json;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const logExportSlice = createSlice({
  name: 'logExport',
  initialState,
  reducers: {
    clearError(state)      { state.error = null; },
    resetLogExport(state)  { Object.assign(state, initialState); },
  },
  extraReducers: (builder) => {

    // fetchArchiveList
    builder
      .addCase(fetchArchiveList.pending,   (state) => {
        state.loadingList = true;
        state.error       = null;
      })
      .addCase(fetchArchiveList.fulfilled, (state, action) => {
        state.loadingList = false;
        state.isFetched   = true;
        state.files       = action.payload.files;
        state.totalSize   = action.payload.totalSize;
      })
      .addCase(fetchArchiveList.rejected,  (state, action) => {
        state.loadingList = false;
        state.isFetched   = true;
        state.error       = action.payload as string;
      });

    // fetchLokiStatus
    builder
      .addCase(fetchLokiStatus.pending,   (state) => { state.loadingStatus = true; })
      .addCase(fetchLokiStatus.fulfilled, (state, action) => {
        state.loadingStatus = false;
        state.lokiStatus    = action.payload;
      })
      .addCase(fetchLokiStatus.rejected,  (state) => { state.loadingStatus = false; });

    // downloadArchive
    builder
      .addCase(downloadArchive.pending,   (state, action) => {
        state.actionTarget = action.meta.arg;
        state.actionType   = 'download';
        state.error        = null;
      })
      .addCase(downloadArchive.fulfilled, (state) => {
        state.actionTarget = null;
        state.actionType   = null;
      })
      .addCase(downloadArchive.rejected,  (state, action) => {
        state.actionTarget = null;
        state.actionType   = null;
        state.error        = action.payload as string;
      });

    // deleteArchive
    builder
      .addCase(deleteArchive.pending,   (state, action) => {
        state.actionTarget = action.meta.arg.filename;
        state.actionType   = 'delete';
        state.error        = null;
      })
      .addCase(deleteArchive.fulfilled, (state, action) => {
        state.files        = state.files.filter(f => f.filename !== action.payload.filename);
        state.actionTarget = null;
        state.actionType   = null;
      })
      .addCase(deleteArchive.rejected,  (state, action) => {
        state.actionTarget = null;
        state.actionType   = null;
        state.error        = action.payload as string;
      });

    // uploadArchive
    builder
      .addCase(uploadArchive.pending,   (state) => {
        state.actionType = 'upload';
        state.error      = null;
      })
      .addCase(uploadArchive.fulfilled, (state, action) => {
        state.actionType = null;
        if (!state.files.find(f => f.filename === action.payload.filename)) {
          state.files.unshift(action.payload);
        }
      })
      .addCase(uploadArchive.rejected,  (state, action) => {
        state.actionType = null;
        state.error      = action.payload as string;
      });

    // restoreArchive
    builder
      .addCase(restoreArchive.pending,   (state, action) => {
        state.actionTarget = action.meta.arg;
        state.actionType   = 'restore';
        state.error        = null;
      })
      .addCase(restoreArchive.fulfilled, (state) => {
        state.actionTarget = null;
        state.actionType   = null;
      })
      .addCase(restoreArchive.rejected,  (state, action) => {
        state.actionTarget = null;
        state.actionType   = null;
        state.error        = action.payload as string;
      });
  },
});

export const { clearError, resetLogExport } = logExportSlice.actions;
export default logExportSlice.reducer;