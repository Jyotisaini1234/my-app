
import { configureStore } from '@reduxjs/toolkit';
import clientsReducer from './slice/clientsSlice/clientsSlice';
import tradeLogsReducer from './slice/tradeLogsSlice/tradeLogsSlice';
import ordersReducer from './slice/ordersSlice/ordersSlice';
import uiReducer from './slice/uiSlice/uiSlice';
import tradeReducer from './slice/tradeSlice/tradeSlice';
import logsReducer from './slice/logsSlice/logsSlice';
import bulkTradeReducer from './slice/bulkTradeSlice/bulkTradeSlice';
import tradeHistoryReducer from './slice/tradeHistorySlice/tradeHistorySlice';

export const store = configureStore({
  reducer: {
    clients: clientsReducer,
    tradeLogs: tradeLogsReducer,
    orders: ordersReducer,
    ui: uiReducer,
    trades: tradeReducer,
    logs: logsReducer,
    bulkTrade: bulkTradeReducer,
    tradeHistory: tradeHistoryReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
