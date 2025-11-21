import React, { useEffect, useState } from 'react';
import { ExternalLink, Search, RefreshCw, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTimeline, fetchLogsByTrace } from '../../../store/slice/logsSlice/logsSlice';
import { LogsModal } from '../LogsModel/LogsModel';
import './LogsTab.scss';

interface SearchFilters {
  clientCode: string;
  startDate: string;
  endDate: string;
  status: string;
  requestType: string;
}

export const LogsTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timeline, traceLogsData, loading, error } = useAppSelector(state => state.logs);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    clientCode: '',
    startDate: '',
    endDate: '',
    status: '',
    requestType: ''
  });
useEffect(() => {
  if (timeline && timeline.timeline) {
    console.log('All request types:', timeline.timeline.map((log: any) => log.requestType));
    const uniqueTypes = Array.from(
      new Set(timeline.timeline.map((log: any) => log.requestType).filter(Boolean))
    ).sort();
    console.log('Unique types:', uniqueTypes);
    setRequestTypes(uniqueTypes);
  }
}, [timeline]);
useEffect(() => {
  
  dispatch(fetchTimeline());
  }, []);

  const handleTraceClick = async (traceId: string) => {
    setSelectedTraceId(traceId);
    setLoadingTrace(true);
    await dispatch(fetchLogsByTrace({ traceId }));
    setLoadingTrace(false);
  };

  const handleCloseModal = () => {
    setSelectedTraceId(null);
  };

  const handleSearch = () => {
    const timelineFilters: any = {
      limit: 100
    };

    if (filters.clientCode) timelineFilters.clientCode = filters.clientCode;
    if (filters.startDate) timelineFilters.startDate = filters.startDate;
    if (filters.endDate) timelineFilters.endDate = filters.endDate;
    if (filters.status) timelineFilters.status = filters.status;
    if (filters.requestType) timelineFilters.requestType = filters.requestType;

    dispatch(fetchTimeline());
  };

  const handleReset = () => {
    setFilters({
      clientCode: '',
      startDate: '',
      endDate: '',
      status: '',
      requestType: ''
    });
    dispatch(fetchTimeline());
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTraceId) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedTraceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return '#10b981';
      case 'ERROR': return '#ef4444';
      case 'PARTIAL': return '#f59e0b';
      default: return '#64748b';
    }
  };

const getRequestTypeLabel = (type: string) => {
    return type || 'N/A';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
    });
  };

  const hasActiveFilters = () => {
    return filters.clientCode || filters.startDate || filters.endDate || filters.status || filters.requestType;
  };

  if (loading && !timeline) {
    return (
      <div className="loading-container">
        <div className="loading-text">⏳Loading logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-title"> Error loading logs</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="logs-tab">
      {/* Header with Stats */}
      <div className="logs-header">
        <h2 className="logs-title">Trade Logs Timeline</h2>
        <div className="logs-stats">
          {timeline && (
            <>
              <span>Total: <strong>{timeline.totalLogs}</strong></span>
              <span>Success: <strong className="success">{timeline.statistics.successCount}</strong></span>
              <span>Errors: <strong className="error">{timeline.statistics.errorCount}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Search/Filter Section */}
      <div className="search-section">
        <div className="search-header">
          <button  className="toggle-filters-btn"onClick={() => setShowFilters(!showFilters)}>
            <Search size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters() && <span className="active-badge">{Object.values(filters).filter(Boolean).length}</span>}
          </button>
          
          {hasActiveFilters() && (
            <button className="reset-btn" onClick={handleReset}> <X size={16} /> Clear All</button>
          )}
        </div>

        {showFilters && (
          <div className="filters-container">
            <div className="filters-grid">
              {/* Client Code */}
              <div className="filter-field">
                <label>Client Code</label>
                <input type="text" placeholder="Enter client code" value={filters.clientCode} onChange={(e) => handleFilterChange('clientCode', e.target.value)} />
              </div>

              {/* Start Date */}
              <div className="filter-field">
                <label>Start Date</label>
                <input type="datetime-local" value={filters.startDate}  onChange={(e) => handleFilterChange('startDate', e.target.value)} />
              </div>

              {/* End Date */}
              <div className="filter-field">
                <label>End Date</label>
                <input type="datetime-local"  value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
              </div>

              {/* Status */}
              <div className="filter-field">
                <label>Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} >
                  <option value="">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="ERROR">Error</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
<div className="filter-field">
  <label>Request Type</label>
  <select value={filters.requestType} onChange={(e) => handleFilterChange('requestType', e.target.value)}>
    <option value="">All Types</option>
    {requestTypes.map(type => (
      <option key={type} value={type}>{type}</option>
    ))}
  </select>
</div>
            </div>

            <div className="filter-actions">
              <button className="search-btn" onClick={handleSearch}> <Search size={18} /> Search Logs </button>
              <button className="refresh-btn" onClick={handleReset}><RefreshCw size={18} /> Reset  </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs List */}
      {!timeline || timeline.timeline.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No trade logs found</p>
          <p className="empty-subtitle"> {hasActiveFilters()  ? 'Try adjusting your filters'  : 'Place an order to see logs here'} </p>
        </div>
      ) : (
        <div className="logs-list">
          {timeline.timeline.map((log: any) => (
            <div key={log.id} className="log-card">
              <div className="log-content">
                <div className="log-grid">
                  <div className="log-field">
                    <div className="field-label">CLIENT</div>
                    <div className="field-value client">{log.clientCode || 'N/A'}</div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">TYPE</div>
                    <div className="field-value">{getRequestTypeLabel(log.requestType)}</div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">TRACE ID</div>
                    <div className="field-value trace-id" onClick={() => handleTraceClick(log.traceId)} >
                      {log.traceId.substring(0, 8)}...
                    </div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">STATUS</div>
                    <div className="field-value">
                      <span className={`status-badge ${log.status.toLowerCase()}`} style={{background: getStatusColor(log.status) + '20',  color: getStatusColor(log.status),borderColor: getStatusColor(log.status) }} >
                        {log.status}
                      </span>
                    </div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">TIME</div>
                    <div className="field-value time">{formatDate(log.requestTime)}</div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">DURATION</div>
                    <div className="field-value duration">
                      {log.durationMs ? `${log.durationMs}ms` : 'N/A'}
                    </div>
                  </div>
                </div>
  
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedTraceId && (
        <LogsModal  traceId={selectedTraceId} lokiLogs={traceLogsData?.lokiLogs || []} grafanaUrl={traceLogsData?.grafanaLokiUrl}loading={loadingTrace}onClose={handleCloseModal}/> )}
    
    </div>
  );
};