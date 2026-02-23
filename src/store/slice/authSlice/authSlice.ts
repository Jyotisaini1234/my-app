import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const AUTH_BASE = 'http://ec2-13-233-121-193.ap-south-1.compute.amazonaws.com:8081/api/auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  role: string;
  status: string;
  lastLoginAt?: string;
}

export interface PendingSignup {
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
}

export type AuthView = 'login' | 'signup' | 'forgot';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  resetToken: string | null;
  forgotEmail: string | null;
  forgotStep: 1 | 2 | 3;    
  authView: AuthView;       
  pendingSignup: PendingSignup | null;
}

const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

const apiPost = async (path: string, body: any) => {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${AUTH_BASE}${path}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) },
      15000
    );
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Request timed out. Server is not responding — please try again.');
    throw new Error('Cannot reach server. Check your internet connection.');
  }
  const text = await res.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(data?.error || data?.message || `Server error (${res.status})`);
  return data;
};

const apiGet = async (path: string) => {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${AUTH_BASE}${path}`, { method: 'GET', credentials: 'include' }, 10000);
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Request timed out.');
    throw new Error('Cannot reach server.');
  }
  const text = await res.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(data?.error || `Server error (${res.status})`);
  return data;
};

export const loginThunk = createAsyncThunk('auth/login',
  async (payload: { identifier: string; password: string }, { rejectWithValue }) => {
    try { return await apiPost('/login', payload); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const sendSignupOtpThunk = createAsyncThunk('auth/sendSignupOtp',
  async (payload: { name: string; email: string; phone: string; city: string; password: string }, { rejectWithValue }) => {
    try { await apiPost('/send-signup-otp', { email: payload.email }); return payload; }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const verifySignupOtpThunk = createAsyncThunk('auth/verifySignupOtp',
  async (payload: { name: string; email: string; phone: string; city: string; address?: string; password: string; role: string; otp: string }, { rejectWithValue }) => {
    try { return await apiPost('/verify-signup-otp', payload); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const sendForgotOtpThunk = createAsyncThunk('auth/sendForgotOtp',
  async (email: string, { rejectWithValue }) => {
    try { return await apiPost('/send-forgot-password-otp', { email }); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const verifyForgotOtpThunk = createAsyncThunk('auth/verifyForgotOtp',
  async (payload: { identifier: string; otp: string }, { rejectWithValue }) => {
    try { return await apiPost('/verify-forgot-password-otp', payload); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const resetPasswordThunk = createAsyncThunk('auth/resetPassword',
  async (payload: { email: string; resetToken: string; newPassword: string }, { rejectWithValue }) => {
    try { return await apiPost('/reset-password', payload); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const resendOtpThunk = createAsyncThunk('auth/resendOtp',
  async (payload: { email: string; purpose: 'signup' | 'forgot-password' | 'login' }, { rejectWithValue }) => {
    try { return await apiPost('/resend-otp', payload); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout',
  async (_, { rejectWithValue }) => {
    try { return await apiPost('/logout', {}); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const validateSessionThunk = createAsyncThunk('auth/validateSession',
  async (_, { rejectWithValue }) => {
    try { return await apiGet('/validate-session'); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

export const refreshTokenThunk = createAsyncThunk('auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try { return await apiPost('/refresh-token', {}); }
    catch (e: any) { return rejectWithValue(e.message); }
  }
);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  otpSent: false,
  resetToken: null,
  forgotEmail: null,
  forgotStep: 1,
  authView: 'login',
  pendingSignup: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError:       (state) => { state.error = null; },
    resetLoading:     (state) => { state.loading = false; },
    clearOtpState:    (state) => { state.otpSent = false; state.pendingSignup = null; },
    clearForgotState: (state) => {
      state.resetToken  = null;
      state.forgotEmail = null;
      state.forgotStep  = 1;       
    },
    setForgotEmail: (state, action: PayloadAction<string>)      => { state.forgotEmail = action.payload; },
    setForgotStep:  (state, action: PayloadAction<1 | 2 | 3>)  => { state.forgotStep  = action.payload; },
    setAuthView:    (state, action: PayloadAction<AuthView>)    => { state.authView    = action.payload; }, // ✅ NEW
  },
  extraReducers: (builder) => {

    // ── Login ──
    builder
      .addCase(loginThunk.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled,  (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.userId, name: action.payload.username,
          email: action.payload.email, phone: action.payload.phone,
          city: action.payload.city || '', address: action.payload.address || '',
          role: action.payload.role, status: action.payload.status,
          lastLoginAt: action.payload.lastLoginAt,
        };
      })
      .addCase(loginThunk.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });

    // ── Send Signup OTP ──
    builder
      .addCase(sendSignupOtpThunk.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(sendSignupOtpThunk.fulfilled,  (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.pendingSignup = {
          name: action.payload.name, email: action.payload.email,
          phone: action.payload.phone, city: action.payload.city,
          password: action.payload.password,
        };
      })
      .addCase(sendSignupOtpThunk.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });

    // ── Verify Signup OTP ──
    builder
      .addCase(verifySignupOtpThunk.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(verifySignupOtpThunk.fulfilled,  (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.otpSent = false;
        state.pendingSignup = null;
        state.user = {
          id: action.payload.id, name: action.payload.name,
          email: action.payload.email, phone: action.payload.phone,
          city: action.payload.city || '', address: action.payload.address || '',
          role: action.payload.role, status: action.payload.status,
        };
      })
      .addCase(verifySignupOtpThunk.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });

    // ── Send Forgot OTP ──
    builder
      .addCase(sendForgotOtpThunk.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(sendForgotOtpThunk.fulfilled,  (state) => { state.loading = false; })
      .addCase(sendForgotOtpThunk.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });

    // ── Verify Forgot OTP ──
    builder
      .addCase(verifyForgotOtpThunk.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(verifyForgotOtpThunk.fulfilled,  (state, action) => { state.loading = false; state.resetToken = action.payload.resetToken; })
      .addCase(verifyForgotOtpThunk.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });

    // ── Reset Password ──
    builder
      .addCase(resetPasswordThunk.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(resetPasswordThunk.fulfilled,  (state) => {
        state.loading = false;
        state.resetToken = null;
        state.forgotEmail = null;
        state.forgotStep = 1;
      })
      .addCase(resetPasswordThunk.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });

    // ── Logout ──
    builder
      .addCase(logoutThunk.fulfilled, (state) => { Object.assign(state, { ...initialState }); })
      .addCase(logoutThunk.rejected,  (state) => { Object.assign(state, { ...initialState }); });

    // ── Validate Session ──
      builder
      .addCase(validateSessionThunk.pending,    (state) => { state.loading = true; })
      .addCase(validateSessionThunk.fulfilled,  (state, action) => {
        state.loading = false;
        if (action.payload.authenticated && action.payload.user) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(validateSessionThunk.rejected,   (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    // ── Resend OTP ──
    builder
      .addCase(resendOtpThunk.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(resendOtpThunk.fulfilled,  (state) => { state.loading = false; })
      .addCase(resendOtpThunk.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const {
  clearError,
  clearOtpState,
  clearForgotState,
  setForgotEmail,
  setForgotStep,
  setAuthView,   
  resetLoading,
} = authSlice.actions;

export default authSlice.reducer;