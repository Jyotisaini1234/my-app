import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BROKER_BASE } from '../../../utils/ApiConstants';


export type OrderStatus = 'COMPLETE' | 'REJECTED' | 'CANCELLED';

export interface OrderNotification {
  id:              string;
  uniqueOrderId:   string;
  status:          OrderStatus;
  clientCode:      string;
  symbol:          string;
  exchange:        string;
  buyOrSell:       string;
  quantity:        number;
  orderPrice:      number;
  executedPrice:   number | null;
  rejectionReason: string | null;
  message:         string;
  timestamp:       number;
  seen:            boolean;
}

export interface SsePayload {
  type:             string;
  uniqueOrderId:    string;
  status:           OrderStatus;
  clientCode:       string;
  symbol:           string;
  exchange:         string;
  buyOrSell:        string;
  quantity:         number;
  orderPrice:       number;
  executedPrice?:   number;
  rejectionReason?: string;
  message:          string;
  timestamp:        number;
}

export type SseConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export interface NotificationsState {
  connectionStatus: SseConnectionStatus;
  notifications:    OrderNotification[];
  unseenCount:      number;
}


const initialState: NotificationsState = {
  connectionStatus: 'idle',
  notifications:    [],
  unseenCount:      0,
};

export const receiveOrderNotification = createAsyncThunk<OrderNotification, SsePayload>(
  'notifications/receive',
  async (payload) => ({
    id:              `${payload.uniqueOrderId}_${payload.timestamp}`,
    uniqueOrderId:   payload.uniqueOrderId,
    status:          payload.status,
    clientCode:      payload.clientCode,
    symbol:          payload.symbol,
    exchange:        payload.exchange,
    buyOrSell:       payload.buyOrSell,
    quantity:        payload.quantity,
    orderPrice:      payload.orderPrice,
    executedPrice:   payload.executedPrice   ?? null,
    rejectionReason: payload.rejectionReason ?? null,
    message:         payload.message,
    timestamp:       payload.timestamp,
    seen:            false,
  })
);

export const startSseConnection = createAsyncThunk<
  void,
  {
    clientCode:     string;
    onMessage:      (payload: SsePayload) => void;
    onStatusChange: (status: SseConnectionStatus) => void;
  }
>(
  'notifications/startSse',
  async ({ clientCode, onMessage, onStatusChange }, { signal }) => {
    const url = `${BROKER_BASE}/api/notifications/subscribe?clientCode=${encodeURIComponent(clientCode)}`;

    onStatusChange('connecting');

    await new Promise<void>((resolve, reject) => {
      const es = new EventSource(url);

      signal.addEventListener('abort', () => {
        es.close();
        onStatusChange('disconnected');
        resolve();
      });

      es.addEventListener('connected', () => {
        onStatusChange('connected');
      });

      es.addEventListener('order-update', (event: MessageEvent) => {
        try {
          const payload: SsePayload = JSON.parse(event.data as string);
          onMessage(payload);
        } catch (err) {
          // console.error('[SSE] Payload parse error:', err);
        }
      });

      es.onerror = () => {
        es.close();
        onStatusChange('error');
        reject(new Error('SSE connection failed'));
      };
    });
  }
);


const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setConnectionStatus(state, action: PayloadAction<SseConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
    markAllSeen(state) {
      state.notifications.forEach(n => { n.seen = true; });
      state.unseenCount = 0;
    },
    clearNotifications(state) {
      state.notifications = [];
      state.unseenCount   = 0;
    },
  },
  extraReducers: (builder) => {

    builder
      .addCase(startSseConnection.pending,   (state) => { state.connectionStatus = 'connecting';   })
      .addCase(startSseConnection.fulfilled, (state) => { state.connectionStatus = 'disconnected'; })
      .addCase(startSseConnection.rejected,  (state) => { state.connectionStatus = 'error';        });

    builder
      .addCase(receiveOrderNotification.fulfilled, (state, action) => {
        state.notifications = [action.payload, ...state.notifications].slice(0, 20);
        state.unseenCount  += 1;
      });
  },
});

export const { setConnectionStatus, markAllSeen, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;