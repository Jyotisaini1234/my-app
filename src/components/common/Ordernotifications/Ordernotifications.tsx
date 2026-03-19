import React, { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import {startSseConnection,receiveOrderNotification, setConnectionStatus,SsePayload,SseConnectionStatus,} from '../../../store/slice/notificationsSlice/notificationsSlice';
import { useToast }  from '../../../context/ToastContext/Toastcontext';
import { STATUS_TITLE, STATUS_TOAST } from '../Toast/Toast';

interface Props {
  clientCode: string;
}


const OrderNotifications: React.FC<Props> = ({ clientCode }) => {
  const dispatch      = useAppDispatch();
  const { showToast } = useToast();
  const thunkRef   = useRef<ReturnType<typeof dispatch> & { abort?: () => void } | null>(null);
  const retryRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const handleMessage = useCallback((payload: SsePayload) => {
    showToast(payload.message, STATUS_TOAST[payload.status] ?? 'info');
    dispatch(receiveOrderNotification(payload));
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(STATUS_TITLE[payload.status] ?? 'Order Update', {
        body: payload.message,
        icon: '/favicon.ico',
      });
    }
  }, [dispatch, showToast]);

  const handleStatusChange = useCallback((status: SseConnectionStatus) => {
    dispatch(setConnectionStatus(status));
  }, [dispatch]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const promise = dispatch(
      startSseConnection({ clientCode, onMessage: handleMessage, onStatusChange: handleStatusChange })
    ) as unknown as Promise<any> & { abort: () => void };

    thunkRef.current = promise as any;

    promise
      .then((result: any) => {
        if (startSseConnection.rejected.match(result) && mountedRef.current) {
          retryRef.current = setTimeout(connect, 10_000);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          retryRef.current = setTimeout(connect, 10_000);
        }
      });
  }, [clientCode, dispatch, handleMessage, handleStatusChange]);

  useEffect(() => {
    mountedRef.current = true;

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    connect();

    return () => {
      mountedRef.current = false;

      const t = thunkRef.current as any;
      if (t && typeof t.abort === 'function') t.abort();

      if (retryRef.current) clearTimeout(retryRef.current);
      dispatch(setConnectionStatus('disconnected'));
    };
  }, [clientCode, connect, dispatch]);

  return null;
};

export default OrderNotifications;