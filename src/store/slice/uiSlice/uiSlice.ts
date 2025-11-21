
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeTab: 'clients' | 'orders' | 'logs';
  notification: { type: 'success' | 'error'; message: string } | null;
}

const initialState: UIState = {
  activeTab: 'clients',
  notification: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'clients' | 'orders' | 'logs'>) => {
      state.activeTab = action.payload;
    },
    showNotification: (state, action: PayloadAction<{ type: 'success' | 'error'; message: string }>) => {
      state.notification = action.payload;
    },
    hideNotification: (state) => {
      state.notification = null;
    }
  }
});

export const { setActiveTab, showNotification, hideNotification } = uiSlice.actions;
export default uiSlice.reducer;
