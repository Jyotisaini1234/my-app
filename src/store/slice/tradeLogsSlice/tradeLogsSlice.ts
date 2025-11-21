
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TradeLog } from '../../../types/type';

const initialState: TradeLog[] = [];

const tradeLogsSlice = createSlice({
  name: 'tradeLogs',
  initialState,
  reducers: {
    addLog: (state, action: PayloadAction<TradeLog>) => {
      state.unshift({ ...action.payload, timestamp: new Date().toISOString() });
      if (state.length > 100) state.pop();
    },
    clearLogs: () => []
  }
});

export const { addLog, clearLogs } = tradeLogsSlice.actions;
export default tradeLogsSlice.reducer;
