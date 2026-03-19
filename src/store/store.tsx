
import { configureStore } from '@reduxjs/toolkit';
import clientsReducer from './slice/clientsSlice/clientsSlice';
import uiReducer from './slice/uiSlice/uiSlice';
import bulkTradeReducer from './slice/bulkTradeSlice/bulkTradeSlice';
import tradeHistoryReducer from './slice/tradeHistorySlice/tradeHistorySlice';
import authReducer from './slice/authSlice/authSlice';
import { groupApi } from './slice/groupsSlice/groupsSlice';
import logExportReducer from './slice/logExportSlice/logExportSlice';
import notificationsReducer from './slice/notificationsSlice/notificationsSlice';

export const store = configureStore({
  reducer: {
    clients: clientsReducer,
    ui: uiReducer,
    bulkTrade: bulkTradeReducer,
    tradeHistory: tradeHistoryReducer,
    auth: authReducer,
    groupApi: groupApi.reducer,
    logExport: logExportReducer,
    notifications: notificationsReducer,
  },
  middleware: (get) => get().concat(groupApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
