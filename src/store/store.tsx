
import { configureStore } from '@reduxjs/toolkit';
import clientsReducer from './slice/clientsSlice/clientsSlice';
import uiReducer from './slice/uiSlice/uiSlice';
import bulkTradeReducer from './slice/bulkTradeSlice/bulkTradeSlice';
import tradeHistoryReducer from './slice/tradeHistorySlice/tradeHistorySlice';
import authReducer from './slice/authSlice/authSlice';
import logExportReducer from './slice/logExportSlice/logExportSlice';
import notificationsReducer from './slice/notificationsSlice/notificationsSlice';
import groupsReducer from './slice/groupsSlice/groupsSlice';

export const store = configureStore({
  reducer: {
    clients: clientsReducer,
    ui: uiReducer,
    bulkTrade: bulkTradeReducer,
    tradeHistory: tradeHistoryReducer,
    auth: authReducer,
    logExport: logExportReducer,
    notifications: notificationsReducer,
    groups: groupsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
