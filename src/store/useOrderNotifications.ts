import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from './hooks';
import { useToast } from '../context/ToastContext/Toastcontext';
import { BROKER_BASE } from '../utils/ApiConstants';

const SSE_ENDPOINT = `${BROKER_BASE}/api/client/order-notifications/subscribe`;

const RECONNECT_DELAY_MS  = 5_000;
const MAX_RECONNECT_DELAY = 60_000;

interface OrderUpdateEvent {
  type:           string;        
  uniqueOrderId:  string;
  status:         string;         
  rawStatus:      string;
  clientCode:     string;
  broker:         string;
  symbol:         string;
  exchange:       string;
  buyOrSell:      string;
  quantity:       number;
  orderPrice:     number;
  executedPrice?: number | null;
  rejectionReason?: string | null;
  filledQty?:     number | null;
  timestamp:      number;
  message:        string;         
}

function toastVariant(status: string): 'success' | 'error' | 'info' | 'warning' {
  switch (status.toUpperCase()) {
    case 'SUCCESS':   return 'success';
    case 'FAILED':    return 'error';
    case 'CANCELLED': return 'warning';
    case 'OPEN':
    case 'PENDING':   return 'info';
    default:          return 'info';
  }
}

function buildToastMessage(event: OrderUpdateEvent): string {
  if (event.message) return event.message;
  return `${event.buyOrSell} ${event.symbol} × ${event.quantity} — ${event.status}`;
}


export function useOrderNotifications(): void {
  const { showToast } = useToast();
  const user          = useAppSelector(s => s.auth.user);
  const clientCode    = user?.id || user?.clientCode;

  const esRef           = useRef<EventSource | null>(null);
  const reconnectDelay  = useRef(RECONNECT_DELAY_MS);
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted       = useRef(true);

  const connect = useCallback(() => {
    if (!clientCode || !isMounted.current) return;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${SSE_ENDPOINT}?clientCode=${encodeURIComponent(clientCode)}`;
    const es  = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.addEventListener('connected', () => {
      reconnectDelay.current = RECONNECT_DELAY_MS; 
    });

    es.addEventListener('order-update', (e: MessageEvent) => {
      try {
        const event: OrderUpdateEvent = JSON.parse(e.data);
        if (event.type !== 'ORDER_STATUS_UPDATE') return;

        const variant = toastVariant(event.status);
        const message = buildToastMessage(event);
        showToast(message, variant);
      } catch {
      }
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (!isMounted.current) return;

      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect();
      }, reconnectDelay.current);

      reconnectDelay.current = Math.min(
        reconnectDelay.current * 2,
        MAX_RECONNECT_DELAY,
      );
    };
  }, [clientCode, showToast]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
    };
  }, [connect]); 
}