import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BROKER_BASE } from '../../../utils/ApiConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FnoInstrument {
  token:          string;
  symbol:         string;
  tradingSymbol:  string;
  name:           string;
  expiry:         string;
  strikePrice:    string;
  optionType:     string;
  lotSize:        string;
  exchange:       string;
  exchangeName:   string;
  instrumentType: string;
  isSuspended:    boolean;
  isBan:          boolean;
}

export interface FnoQuote {
  token:        string;
  tradingSymbol: string;
  ltp:          number;
  open:         number;
  high:         number;
  low:          number;
  close:        number;
  change:       number;
  changePct:    number;
  volume:       number;
  oi:           number;
}

export interface WatchlistEntry {
  token:          string;
  symbol:         string;
  tradingSymbol:  string;
  exchange:       string;
  instrumentType: string;
  optionType:     string;
  expiry:         string;
  strikePrice:    string;
  lotSize:        string;
}

export interface FnoWatchlistState {
  instruments:        FnoInstrument[];
  instrumentsLoading: boolean;
  instrumentsError:   string | null;
  instrumentsFetched: boolean;
  watchlist:          WatchlistEntry[];

  quotes:        FnoQuote[];
  quotesLoading: boolean;
  quotesError:   string | null;
  lastRefreshed: string | null;

  searchQuery:      string;
  selectedExchange: string;
  selectedType:     string;
  activeView:       'instruments' | 'watchlist';
}

// ─── Backend raw shape ────────────────────────────────────────────────────────

interface BackendInstrument {
  scripCode:      string | number;
  tradingSymbol:  string;
  symbol:         string;
  fullName:       string;
  instType:       string;
  instrumentName: string;
  expiry:         string;
  strikePrice:    string;
  optionType:     string;
  exchange:       string;
  exchangeName:   string;
  lotSize:        number | string;
  isSuspended:    boolean;
  isBan:          boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN',
                     'JUL','AUG','SEP','OCT','NOV','DEC'] as const;

const MONTH_MAP: Record<string, number> = {
  jan:0, feb:1, mar:2, apr:3, may:4,  jun:5,
  jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
};

/** Parse expiry into { day, month, year } in IST, regardless of input format. */
function parseExpiry(expiry: string | number | undefined): { d: number; m: number; y: number } | null {
  if (expiry == null) return null;

  const num = Number(expiry);

  if (!isNaN(num) && num > 1_000_000_000) {
    // Unix timestamp (seconds) — convert to IST (UTC+5:30)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const ist = new Date(num * 1000 + IST_OFFSET_MS);
    return { d: ist.getUTCDate(), m: ist.getUTCMonth(), y: ist.getUTCFullYear() };
  }

  if (typeof expiry === 'string' && expiry.includes('-')) {
    // "26-May-2026"
    const parts = expiry.trim().split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const y = parseInt(parts[2], 10);
      const m = MONTH_MAP[parts[1].toLowerCase()];
      if (m !== undefined && !isNaN(d) && !isNaN(y)) return { d, m, y };
    }
  }

  return null;
}

function buildShoonyaTsym(raw: BackendInstrument): string {
  const sym = (raw.symbol ?? '').trim().toUpperCase();

  const exp = parseExpiry(raw.expiry);
  if (!exp) return raw.fullName?.trim() || sym;

  // Shoonya format: no zero-padding on day
  const dd  = String(exp.d);
  const mon = MONTH_NAMES[exp.m];
  const yy  = String(exp.y).slice(-2);   // 2026 → "26"

  const instType = (raw.instType ?? raw.instrumentName ?? '').toUpperCase();
  const optType  = (raw.optionType ?? '').toUpperCase();  // ONLY optionType, no instType fallback

  // Futures
  if (instType.startsWith('FUT')) {
    return `${sym}${dd}${mon}${yy}FUT`;          // e.g. NIFTY29MAY26FUT
  }

  // Options
  if (optType === 'CE' || optType === 'PE') {
    const side   = optType === 'CE' ? 'C' : 'P';
    const strike = raw.strikePrice
      ? String(Math.round(parseFloat(raw.strikePrice)))  // 184.0 → "184"
      : '';
    return `${sym}${dd}${mon}${yy}${side}${strike}`;    // e.g. IOC26MAY26P184
  }

  return raw.fullName?.trim() || sym;
}

function normalize(raw: BackendInstrument): FnoInstrument {
  return {
    token:          String(raw.scripCode),
    symbol:         raw.symbol              ?? '',
    tradingSymbol:  buildShoonyaTsym(raw),
    name:           raw.fullName            ?? '',
    expiry:         raw.expiry              ?? '',
    strikePrice:    raw.strikePrice         ?? '0',
    optionType:     raw.optionType          ?? '',   // ✅ Fixed: was raw.instType
    lotSize:        String(raw.lotSize      ?? ''),
    exchange:       raw.exchange            ?? '',
    exchangeName:   raw.exchangeName        ?? '',
    instrumentType: raw.instType            ?? raw.instrumentName ?? '',  // ✅ Fixed
    isSuspended:    raw.isSuspended         ?? false,
    isBan:          raw.isBan               ?? false,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const WATCHLIST_KEY = 'fno_watchlist_v1';
function loadWatchlist(): WatchlistEntry[] {
  try { const r = localStorage.getItem(WATCHLIST_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveWatchlist(list: WatchlistEntry[]) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list)); } catch {}
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: FnoWatchlistState = {
  instruments:        [],
  instrumentsLoading: false,
  instrumentsError:   null,
  instrumentsFetched: false,
  watchlist:          loadWatchlist(),

  quotes:        [],
  quotesLoading: false,
  quotesError:   null,
  lastRefreshed: null,

  searchQuery:      '',
  selectedExchange: 'NSEFO',
  selectedType:     'ALL',
  activeView:       'instruments',
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

const BASE = `${BROKER_BASE}/api/broker/fno`;

export const fetchScripMaster = createAsyncThunk(
  'fnoWatchlist/fetchScripMaster',
  async (
    { clientCode, exchange = 'NSEFO' }: { clientCode: string; exchange?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${BASE}/scrip-master?clientCode=${clientCode}&exchange=${exchange}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== 'SUCCESS') throw new Error(data.message || 'Scrip master failed');
      return (data.instruments as BackendInstrument[]).map(normalize);
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Unknown error');
    }
  }
);

export const fetchWatchlistLtp = createAsyncThunk(
  'fnoWatchlist/fetchWatchlistLtp',
  async (
    { clientCode, symbols }: { clientCode: string; symbols: WatchlistEntry[] },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${BASE}/ltp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCode,
          instruments: symbols.map(s => ({ token: s.token, symbol: s.symbol, exchange: s.exchange })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== 'SUCCESS') throw new Error(data.message || 'LTP fetch failed');
      return data.quotes as FnoQuote[];
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Unknown error');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const fnoWatchlistSlice = createSlice({
  name: 'fnoWatchlist',
  initialState,
  reducers: {
    addToWatchlist(state, action: PayloadAction<WatchlistEntry>) {
      if (!state.watchlist.some(w => w.token === action.payload.token)) {
        state.watchlist.push(action.payload);
        saveWatchlist(state.watchlist);
      }
    },
    removeFromWatchlist(state, action: PayloadAction<string>) {
      state.watchlist = state.watchlist.filter(w => w.token !== action.payload);
      state.quotes    = state.quotes.filter(q => q.token !== action.payload);
      saveWatchlist(state.watchlist);
    },
    clearWatchlist(state) {
      state.watchlist = [];
      state.quotes    = [];
      saveWatchlist([]);
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedExchange(state, action: PayloadAction<string>) {
      state.selectedExchange   = action.payload;
      state.instruments        = [];
      state.instrumentsFetched = false;
    },
    setSelectedType(state, action: PayloadAction<string>) {
      state.selectedType = action.payload;
    },
    setActiveView(state, action: PayloadAction<'instruments' | 'watchlist'>) {
      state.activeView   = action.payload;
      state.searchQuery  = '';
      state.selectedType = 'ALL';
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchScripMaster.pending,   state => {
        state.instrumentsLoading = true;
        state.instrumentsError   = null;
        state.instruments        = [];
      })
      .addCase(fetchScripMaster.fulfilled, (state, { payload }) => {
        state.instrumentsLoading = false;
        state.instruments        = payload;
        state.instrumentsFetched = true;
      })
      .addCase(fetchScripMaster.rejected,  (state, { payload }) => {
        state.instrumentsLoading = false;
        state.instrumentsError   = payload as string;
        state.instrumentsFetched = false;
      });

    builder
      .addCase(fetchWatchlistLtp.pending,   state => {
        state.quotesLoading = true;
        state.quotesError   = null;
      })
      .addCase(fetchWatchlistLtp.fulfilled, (state, { payload }) => {
        state.quotesLoading = false;
        const map: Record<string, FnoQuote> = {};
        state.quotes.forEach(q => { map[q.token] = q; });
        payload.forEach(q => { map[q.token] = q; });
        state.quotes        = Object.values(map);
        state.lastRefreshed = new Date().toISOString();
      })
      .addCase(fetchWatchlistLtp.rejected,  (state, { payload }) => {
        state.quotesLoading = false;
        state.quotesError   = payload as string;
      });
  },
});

export const {
  addToWatchlist, removeFromWatchlist, clearWatchlist,
  setSearchQuery, setSelectedExchange, setSelectedType, setActiveView,
} = fnoWatchlistSlice.actions;

export default fnoWatchlistSlice.reducer;