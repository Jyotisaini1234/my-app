import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

let _id = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = ++_id;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);

  const dismiss = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="global-toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`global-toast global-toast--${t.type}`}>
            <div className="global-toast__icon">
              {t.type === 'success' && <CheckCircle size={15} />}
              {t.type === 'error'   && <XCircle     size={15} />}
              {t.type === 'info'    && <Info         size={15} />}
            </div>
            <span className="global-toast__msg">{t.msg}</span>
            <button className="global-toast__close" onClick={() => dismiss(t.id)}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);