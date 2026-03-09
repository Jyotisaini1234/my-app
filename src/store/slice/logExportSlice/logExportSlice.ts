import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exportService } from '../../../services/api';
import { TRADE_BASE } from '../../../utils/ApiConstants';

const BASE_URL = `${TRADE_BASE}/api/logs/export`;

interface ArchiveFile {
  filename: string;
  size: string;
  lastModified: string;
}

interface LokiStatus {
  chunksSize: string;
  indexSize: string;
}

interface LogExportState {
  files: ArchiveFile[];
  lokiStatus: LokiStatus | null;
  isFetched: boolean;
  loadingList: boolean;
  loadingStatus: boolean;
  actionTarget: string | null;
  actionType: 'download' | 'delete' | 'upload' | null;
  error: string | null;
}

const initialState: LogExportState = {
  files: [],
  lokiStatus: null,
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
      const data: any = await exportService.listRemote();
      return data.files || [];
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchLokiStatus = createAsyncThunk(
  'logExport/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const data: any = await exportService.getLokiStatus();
      return { chunksSize: data.chunksSize, indexSize: data.indexSize };
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
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      return filename;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const deleteArchive = createAsyncThunk(
  'logExport/delete',
  async (filename: string, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${BASE_URL}/delete-remote/${encodeURIComponent(filename)}`,
        { credentials: 'include', method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      return filename;
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
      return { filename: file.name, size: '', lastModified: new Date().toISOString() };
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
    resetLogExport(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {

    builder
      .addCase(fetchArchiveList.pending,   (state) => { state.loadingList = true; state.error = null; })
      .addCase(fetchArchiveList.fulfilled, (state, action) => {
        state.loadingList = false;
        state.isFetched   = true;
        state.files       = action.payload;
      })
      .addCase(fetchArchiveList.rejected,  (state, action) => {
        state.loadingList = false;
        state.isFetched   = true;
        state.error       = action.payload as string;
      });

    builder
      .addCase(fetchLokiStatus.pending,   (state) => { state.loadingStatus = true; })
      .addCase(fetchLokiStatus.fulfilled, (state, action) => {
        state.loadingStatus = false;
        state.lokiStatus    = action.payload;
      })
      .addCase(fetchLokiStatus.rejected,  (state) => { state.loadingStatus = false; });

    builder
      .addCase(downloadArchive.pending,   (state, action) => {
        state.actionTarget = action.meta.arg;
        state.actionType   = 'download';
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

    builder
      .addCase(deleteArchive.pending,   (state, action) => {
        state.actionTarget = action.meta.arg;
        state.actionType   = 'delete';
      })
      .addCase(deleteArchive.fulfilled, (state, action) => {
        state.files        = state.files.filter(f => f.filename !== action.payload);
        state.actionTarget = null;
        state.actionType   = null;
      })
      .addCase(deleteArchive.rejected,  (state, action) => {
        state.actionTarget = null;
        state.actionType   = null;
        state.error        = action.payload as string;
      });

    builder
      .addCase(uploadArchive.pending,   (state) => { state.actionType = 'upload'; })
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
  },
});

export const { resetLogExport } = logExportSlice.actions;
export default logExportSlice.reducer;