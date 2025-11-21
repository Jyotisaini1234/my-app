import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import './LogsModal.scss';

interface LokiLog {
  timestamp: number;
  level: string;
  message: string;
  thread: string;
  logger: string;
  requestId: string;
  traceId: string;
  spanId: string;
  clientCode: string;
  timestampReadable: string;
}

interface LogsModalProps {
  traceId: string;
  lokiLogs: LokiLog[];
  grafanaUrl?: string;
  loading: boolean;
  onClose: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({traceId,lokiLogs,grafanaUrl,loading,onClose}) => {
  const getLevelClass = (level: string): string => {
    const levelUpper = level.toUpperCase();
    switch (levelUpper) {
      case 'ERROR':
        return 'error';
      case 'WARN':
        return 'warn';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'debug';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Handle ESC key press
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <h2 className="title">Loki Trace Logs</h2>
            <div className="subtitle">
              <span>Trace ID: {traceId}</span>
              {grafanaUrl && (
                <a href={grafanaUrl} target="_blank" rel="noopener noreferrer" className="grafana-link" >
                  <ExternalLink size={14} />
                  View in Grafana
                </a>
              )}
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Logs Content */}
        <div className="logs-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner">⏳</div>
              <div className="loading-text">Loading trace logs...</div>
            </div>
          ) : lokiLogs.length === 0 ? (
            <div className="empty-state">
              <p>No Loki logs found for this trace</p>
            </div>
          ) : (
            <div className="logs-list">
              {lokiLogs.map((log, index) => (
                <div key={index} className={`log-item level-${log.level.toLowerCase()}`}>
                  {/* Log Header */}
                  <div className="log-header">
                    <div className="log-header-left">
                      <span className={`level-badge ${getLevelClass(log.level)}`}>
                        {log.level}
                      </span>
                      {log.clientCode && (
                        <span className="client-code">
                          Client: <strong>{log.clientCode}</strong>
                        </span>
                      )}
                    </div>
                    <div className="timestamp">
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>

                  {/* Log Message */}
                  <div className="log-message">{log.message}</div>

                  {/* Additional Info */}
                  {(log.thread || log.logger || log.requestId || log.spanId) && (
                    <div className="log-additional-info">
                      {log.thread && (
                        <div className="info-item">
                          <span className="info-label">Thread: </span>
                          <span className="info-value">{log.thread}</span>
                        </div>
                      )}
                      {log.logger && (
                        <div className="info-item">
                          <span className="info-label">Logger: </span>
                          <span className="info-value">{log.logger}</span>
                        </div>
                      )}
                      {log.requestId && (
                        <div className="info-item">
                          <span className="info-label">Request ID: </span>
                          <span className="info-value request-id">
                            {log.requestId}
                          </span>
                        </div>
                      )}
                      {log.spanId && (
                        <div className="info-item">
                          <span className="info-label">Span ID: </span>
                          <span className="info-value span-id">
                            {log.spanId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with count */}
        {!loading && lokiLogs.length > 0 && (
          <div className="modal-footer">
            <span>
              Total Logs: <strong>{lokiLogs.length}</strong>
            </span>
            <span className="footer-hint">
              Press ESC or click outside to close
            </span>
          </div>
        )}
      </div>
    </div>
  );
};