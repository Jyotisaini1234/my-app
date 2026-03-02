import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, X, Loader2, AlertCircle } from 'lucide-react';
import { logService } from '../../services/api';
import './OrderLogsPage.scss';


interface TradeLog {
  id?: string;
  clientCode?: string;
  clientName?: string;
  action?: string;
  status?: string;
  uniqueOrderId?: string;
  quantity?: number;
  createdAt?: string;
  traceId?: string;
  spanId?: string;
  buyOrSell?: string;
  symbol?: string;
  exchange?: string;
  price?: number;
}


interface ResponseModalProps {
  title: string;
  id: string;
  fetchFn: (id: string) => Promise<any>;
  onClose: () => void;
}

const ResponseModal: React.FC<ResponseModalProps> = ({ title, id, fetchFn, onClose }) => {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchFn(id)
      .then(setData)
      .catch((e: any) => setError(e.message || 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="resp-modal__overlay" onClick={onClose}>
      <div className="resp-modal" onClick={(e) => e.stopPropagation()}>

        <div className="resp-modal__header">
          <div className="resp-modal__title">
            <span>{title}</span>
            <code className="resp-modal__id">{id}</code>
          </div>
          <button className="resp-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="resp-modal__body">
          {loading && (
            <div className="resp-modal__state">
              <Loader2 size={20} className="spin" /> Fetching…
            </div>
          )}
          {error && (
            <div className="resp-modal__state resp-modal__state--error">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {!loading && !error && (
            <pre className="resp-modal__pre">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>

      </div>
    </div>
  );
};


export const OrderLogsPage: React.FC = () => {
  const [logs, setLogs]       = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [clientCode, setClientCode] = useState('');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');

  const [modal, setModal] = useState<{ type: 'trace' | 'span'; id: string } | null>(null);

  const fmtDate = (d: string) => {
    if (!d) return undefined;
    const [y, m, day] = d.split('-');
    return `${day}-${m}-${y}`;
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await logService.getAllData({
        startDate:  fmtDate(startDate),
        endDate:    fmtDate(endDate),
        clientCode: clientCode.trim() || undefined,
      });
      setLogs(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [clientCode, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, []);

  const hasFilters = clientCode || startDate || endDate;

  const clearFilters = () => {
    setClientCode('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="order-logs">

      <div className="order-logs__header">
        <div>
          <h2 className="order-logs__title">Order Logs</h2>
          <p className="order-logs__subtitle">
            Click <span className="order-logs__hint order-logs__hint--trace">Trace ID</span> to view
            Loki trace &nbsp;·&nbsp; Click <span className="order-logs__hint order-logs__hint--span">Span ID</span> to
            view Motilal response
          </p>
        </div>
        <button className="order-logs__refresh" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="order-logs__filters">
        <div className="order-logs__fi">
          <Search size={13} className="order-logs__fi-icon" />
          <input
            placeholder="Client Code"
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value.toUpperCase())}
          />
        </div>

        <div className="order-logs__fi">
          <label>From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="order-logs__fi">
          <label>To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button className="order-logs__btn-apply" onClick={fetchLogs}>Apply</button>

        {hasFilters && (
          <button className="order-logs__btn-clear" onClick={clearFilters}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className="order-logs__meta-bar">
        <span>{logs.length} record{logs.length !== 1 ? 's' : ''}</span>
      </div>

      {error && (
        <div className="order-logs__error">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="order-logs__table-wrap">
        {loading ? (
          <div className="order-logs__center">
            <Loader2 size={22} className="spin" /> Loading logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="order-logs__center">No logs found. Adjust filters or refresh.</div>
        ) : (
          <table className="order-logs__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client Code</th>
                <th>Client Name</th>
                <th>Action</th>
                <th>Buy/Sell</th>
                <th>Symbol</th>
                <th>Status</th>
                <th>Trace ID</th>
                <th>Span ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id || i}>
                  <td className="order-logs__num">{i + 1}</td>

                  <td>
                    <span className="order-logs__code">{log.clientCode || '—'}</span>
                  </td>

                  <td>{log.clientName || '—'}</td>

                  <td>
                    {log.action ? (
                      <span className={`order-logs__action order-logs__action--${
                        log.action === 'PLACE_ORDER' ? 'place' : 'cancel'
                      }`}>
                        {log.action === 'PLACE_ORDER' ? 'PLACE' : 'CANCEL'}
                      </span>
                    ) : '—'}
                  </td>
                    <td>
                    {log.buyOrSell ? (
                      <span className={`order-logs__action order-logs__action--${log.buyOrSell.toLowerCase()}`}>
                        {log.buyOrSell}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{log.symbol || '—'}</td>
                  <td>
                    {log.status ? (
                      <span className={`order-logs__status order-logs__status--${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                    ) : '—'}
                  </td>

                  <td>
                    {log.traceId ? (
                      <button
                        className="order-logs__link order-logs__link--trace"
                        onClick={() => setModal({ type: 'trace', id: log.traceId! })}
                        title="View Loki trace"
                      >
                        {log.traceId}
                      </button>
                    ) : <span className="order-logs__empty-cell">—</span>}
                  </td>

                  <td>
                    {log.spanId ? (
                      <button
                        className="order-logs__link order-logs__link--span"
                        onClick={() => setModal({ type: 'span', id: log.spanId! })}
                        title="View Span response"
                      >
                        {log.spanId}
                      </button>
                    ) : <span className="order-logs__empty-cell">—</span>}
                  </td>

                  <td className="order-logs__date">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ResponseModal
          title={modal.type === 'trace' ? 'Loki Trace Response' : 'Span Response'}
          id={modal.id}
          fetchFn={modal.type === 'trace' ? logService.getTrace : logService.getSpan}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};