import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';
import './LogsModal.scss';

interface LogsModalProps {
  id: string;
  type: 'trace' | 'span';
  onClose: () => void;
  fullData: any;
  loading?: boolean;
}

export const LogsModal: React.FC<LogsModalProps> = ({id,type,onClose, fullData,loading}) => {
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCopy = () => {
    const jsonString = JSON.stringify(fullData, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonString = fullData ? JSON.stringify(fullData, null, 2) : '{}';
  
  const getTitle = () => {
    if (type === 'trace') return 'Trade Response JSON';
    return ' Motilal Oswal Response JSON';
  };

  const getIdLabel = () => {
    if (type === 'trace') return 'TraceID';
    return 'SpanID';
  };

  const renderJsonWithHighlighting = (jsonStr: string) => {
    return jsonStr.split('\n').map((line, i) => {
      let coloredLine = line;
      
      // Keys (in quotes)
      coloredLine = coloredLine.replace(
        /"([^"]+)":/g, 
        '<span style="color: #38bdf8">"$1"</span>:'
      );
      
      // String values
      coloredLine = coloredLine.replace(
        /: "([^"]*)"/g,
        ': <span style="color: #a3e635">"$1"</span>'
      );
      
      // Numbers
      coloredLine = coloredLine.replace(
        /: (\d+\.?\d*)/g,
        ': <span style="color: #f472b6">$1</span>'
      );
      
      // Booleans
      coloredLine = coloredLine.replace(
        /: (true|false)/g,
        ': <span style="color: #fbbf24">$1</span>'
      );
      
      // null
      coloredLine = coloredLine.replace(
        /: null/g,
        ': <span style="color: #94a3b8">null</span>'
      );
      
      return (
        <div key={i} dangerouslySetInnerHTML={{ __html: coloredLine }}/>
      );
    });
  };

  return (
    <div className="logs-modal-overlay" onClick={onClose}>
      <div className="logs-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="logs-modal-header">
          <div className="header-info">
            <h2 className="modal-title">{getTitle()}</h2>
            <div className="modal-subtitle">
              <span className="id-label">
                {getIdLabel()}: <strong>
                  {id.length > 16 ? `${id.substring(0, 16)}...` : id}
                </strong>
              </span>
              
              {type === 'trace' && fullData?.masterClientCode && (
                <span className="master-label">
                  Master: <strong>{fullData.masterClientCode}</strong>
                </span>
              )}
              
              {fullData?.status && (
                <span className="status-label">
                  Status: <strong className={fullData.status === 'SUCCESS' ? 'success' : 'error'}>
                    {fullData.status}
                  </strong>
                </span>
              )}
              
              {type === 'trace' && fullData?.grafanaUrl && (
                <a href={fullData.grafanaUrl} target="_blank" rel="noopener noreferrer"className="grafana-link" >
                  <ExternalLink size={12} /> Grafana
                </a>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button onClick={handleCopy} className={`copy-button ${copied ? 'copied' : ''}`}  >
              {copied ? (
                <>
                  <Check size={16} />
                  <span className="copy-text">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span className="copy-text">Copy JSON</span>
                </>
              )}
            </button>
            
            <button onClick={onClose} className="close-button">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="logs-modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <div className="loading-text">Loading response data...</div>
            </div>
          ) : !fullData ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No data available</div>
              <div className="empty-subtitle">
                {getIdLabel()}: {id}
              </div>
            </div>
          ) : (
            <pre className="json-pre">
              <code className="json-code">
                {renderJsonWithHighlighting(jsonString)}
              </code>
            </pre>
          )}
        </div>

        {/* Footer */}
        {!loading && fullData && (
          <div className="logs-modal-footer">
            <div className="footer-stats">
              {type === 'trace' && fullData.totalLogs !== undefined && (
                <span className="stat-item">
                  Total Logs: <strong>{fullData.totalLogs}</strong>
                </span>
              )}
              
              {type === 'trace' && fullData.durationReadable && (
                <span className="stat-item">
                  Duration: <strong>{fullData.durationReadable}</strong>
                </span>
              )}
              
              {type === 'trace' && fullData.originalResponse?.totalClients !== undefined && (
                <span className="stat-item">
                  Clients: <strong>{fullData.originalResponse.totalClients}</strong>
                </span>
              )}
              
              {type === 'trace' && fullData.originalResponse?.successCount !== undefined && (
                <span className="stat-item success">
                  ✓ {fullData.originalResponse.successCount}
                </span>
              )}
              
              {type === 'trace' && fullData.originalResponse?.failedCount !== undefined && (
                <span className="stat-item error">
                  ✗ {fullData.originalResponse.failedCount}
                </span>
              )}
              
              {type === 'span' && fullData.clientCode && (
                <span className="stat-item">
                  Client: <strong>{fullData.clientCode}</strong>
                </span>
              )}
              
              {type === 'span' && fullData.orderStatus && (
                <span className="stat-item">
                  Order Status: <strong>{fullData.orderStatus}</strong>
                </span>
              )}
            </div>
            
            <span className="footer-hint">ESC to close</span>
          </div>
        )}
      </div>
    </div>
  );
};