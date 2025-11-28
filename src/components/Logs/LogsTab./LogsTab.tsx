import React, { useEffect, useState } from 'react';
import { ExternalLink, Search, RefreshCw, X, Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTimeline, fetchLogsByTrace, fetchLogsBySpan } from '../../../store/slice/logsSlice/logsSlice';
import './LogsTab.scss';
import { TimelineFilters } from '../../../types/type';
import { LogsModal } from '../LogsModel/LogsModel';

interface SearchFilters {
  clientCode: string;
  startDate: string;
  endDate: string;
  status: string;
  action: string;
}

type ModalType = 'trace' | 'span' | null;

export const LogsTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timeline, traceLogsData, spanLogsData, loading, error } = useAppSelector(state => state.logs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    clientCode: '',
    startDate: '',
    endDate: '',
    status: '',
    action: ''
  });

  // Get today's date in dd-MM-yyyy format
  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Convert dd-MM-yyyy to yyyy-MM-dd for input field
  const convertToInputFormat = (ddmmyyyy: string) => {
    if (!ddmmyyyy) return '';
    const [dd, mm, yyyy] = ddmmyyyy.split('-');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Convert yyyy-MM-dd to dd-MM-yyyy for API
  const convertToAPIFormat = (yyyymmdd: string) => {
    if (!yyyymmdd) return '';
    const [yyyy, mm, dd] = yyyymmdd.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    if (timeline && timeline.timeline) {
      console.log('Timeline data:', timeline);
      const uniqueTypes = Array.from(
        new Set(
          timeline.timeline
            .map((log: any) => log.action)
            .filter(Boolean)
        )
      ).sort();
      console.log('Unique request types:', uniqueTypes);
      setRequestTypes(uniqueTypes);
    }
  }, [timeline]);

  useEffect(() => {
    console.log('Initial fetch - loading all logs');
    dispatch(fetchTimeline());
  }, [dispatch]);

  const handleTraceClick = async (traceId: string) => {
    if (!traceId) {
      console.warn('Invalid traceId');
      return;
    }
    console.log('🔍 Clicking trace:', traceId);
    setSelectedId(traceId);
    setModalType('trace');
    setLoadingData(true);
    try {
      const result = await dispatch(fetchLogsByTrace({ traceId })).unwrap();
      console.log('Trace logs fetched:', result);
    } catch (error) {
      console.error('Error fetching trace logs:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSpanClick = async (spanId: string) => {
    if (!spanId) {
      console.warn('Invalid spanId');
      return;
    }
    console.log('🔍 Clicking span:', spanId);
    setSelectedId(spanId);
    setModalType('span');
    setLoadingData(true);
    try {
      const result = await dispatch(fetchLogsBySpan(spanId)).unwrap();
      console.log('✅ Span logs fetched:', result);
    } catch (error) {
      console.error('❌ Error fetching span logs:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedId(null);
    setModalType(null);
  };

const handleSearch = () => {
    // Convert dates to dd-MM-yyyy format for API
    const apiStartDate = filters.startDate ? convertToAPIFormat(filters.startDate) : undefined;
    const apiEndDate = filters.endDate ? convertToAPIFormat(filters.endDate) : undefined;

    // Build filters object with only non-empty values
    const timelineFilters: TimelineFilters = {
      limit: 100,
      ...(filters.clientCode && { clientCode: filters.clientCode.trim() }),
      ...(apiStartDate && { startDate: apiStartDate }),
      ...(apiEndDate && { endDate: apiEndDate }),
      ...(filters.status && { status: filters.status }),
      ...(filters.action && { action: filters.action }),
    };

    console.log('🔍 Searching with filters:', {
      original: filters,
      apiFormat: timelineFilters,
      queryString: new URLSearchParams(Object.entries(timelineFilters).map(([k, v]) => [k, String(v)])).toString()
    });
    
    dispatch(fetchTimeline(timelineFilters));
  };

  const handleReset = () => {
    setFilters({
      clientCode: '',
      startDate: '',
      endDate: '',
      status: '',
      action: ''
    });
    console.log('🔄 Resetting filters - fetching all logs');
    dispatch(fetchTimeline());
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-validation: if end date is before start date, clear end date
      if (field === 'startDate' && prev.endDate && value > prev.endDate) {
        updated.endDate = '';
        console.warn('⚠️ End date cleared as it was before start date');
      }
      
      return updated;
    });
  };


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedId) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedId]);

  const getStatusColor = (status: string) => {
    if (!status) return '#64748b';
    switch (status.toUpperCase()) {
      case 'SUCCESS': return '#10b981';
      case 'ERROR': return '#ef4444';
      case 'PARTIAL': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    try {
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
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const hasActiveFilters = () => {
    return filters.clientCode || filters.startDate || filters.endDate || filters.status || filters.action;
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(Boolean).length;
  };

  const getTraceIdDisplay = (traceId: string | null | undefined) => {
    if (!traceId) return 'N/A';
    return traceId.length > 8 ? `${traceId.substring(0, 8)}...` : traceId;
  };

  const getSpanIdDisplay = (spanId: string | null | undefined) => {
    if (!spanId) return 'N/A';
    return spanId.length > 8 ? `${spanId.substring(0, 8)}...` : spanId;
  };

  if (loading && !timeline) {
    return (
      <div className="loading-container">
        <div className="loading-text">⏳ Loading logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-title">❌ Error loading logs</div>
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={() => dispatch(fetchTimeline())}>
          <RefreshCw size={16} /> Retry
        </button>
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
              <span>Total: <strong>{timeline.totalLogs || 0}</strong></span>
              <span>Success: <strong className="success">{timeline.statistics?.successCount || 0}</strong></span>
              <span>Errors: <strong className="error">{timeline.statistics?.errorCount || 0}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Search/Filter Section */}
      <div className="search-section">
        <div className="search-header">
          <button className="toggle-filters-btn" onClick={() => setShowFilters(!showFilters)}>
            <Search size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters() && (
              <span className="active-badge">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
          
          {hasActiveFilters() && (
            <button className="reset-btn" onClick={handleReset}>
              <X size={16} /> Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filters-container">
            {/* Quick Date Filters */}
            {/* <div className="quick-filters">
              <span className="quick-label">Quick Date Range:</span>
              <button className="quick-btn" onClick={() => handleQuickDateFilter(1)}>
                Today
              </button>
              <button className="quick-btn" onClick={() => handleQuickDateFilter(7)}>
                Last 7 Days
              </button>
              <button className="quick-btn" onClick={() => handleQuickDateFilter(30)}>
                Last 30 Days
              </button>
              <button className="quick-btn" onClick={() => handleQuickDateFilter(90)}>
                Last 90 Days
              </button>
            </div> */}

            <div className="filters-grid">
              <div className="filter-field">
                <label>Client Code</label>
                <input
                  type="text"
                  placeholder="e.g., SOAR1439"
                  value={filters.clientCode}
                  onChange={(e) => handleFilterChange('clientCode', e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label>
                  <Calendar size={14} /> Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  max={filters.endDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                {filters.startDate && (
                  <small className="date-hint">
                    📅 {convertToAPIFormat(filters.startDate)}
                  </small>
                )}
              </div>

              <div className="filter-field">
                <label>
                  <Calendar size={14} /> End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  disabled={!filters.startDate}
                />
                {filters.endDate && (
                  <small className="date-hint">
                    📅 {convertToAPIFormat(filters.endDate)}
                  </small>
                )}
              </div>

              <div className="filter-field">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="SUCCESS">✅ Success</option>
                  <option value="ERROR">❌ Error</option>
                  <option value="PARTIAL">⚠️ Partial</option>
                  <option value="PENDING">⏳ Pending</option>
                </select>
              </div>

              <div className="filter-field">
                <label>Action Type</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">All Actions</option>
                  {requestTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-actions">
              <button className="search-btn" onClick={handleSearch}>
                <Search size={18} /> Search Logs
              </button>
              <button className="refresh-btn" onClick={handleReset}>
                <RefreshCw size={18} /> Reset All
              </button>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="active-filters-display">
                <span className="filter-label">Active Filters:</span>
                {filters.clientCode && (
                  <span className="filter-tag">
                    Client: {filters.clientCode}
                    <X size={14} onClick={() => handleFilterChange('clientCode', '')} />
                  </span>
                )}
                {filters.startDate && (
                  <span className="filter-tag">
                    From: {convertToAPIFormat(filters.startDate)}
                    <X size={14} onClick={() => handleFilterChange('startDate', '')} />
                  </span>
                )}
                {filters.endDate && (
                  <span className="filter-tag">
                    To: {convertToAPIFormat(filters.endDate)}
                    <X size={14} onClick={() => handleFilterChange('endDate', '')} />
                  </span>
                )}
                {filters.status && (
                  <span className="filter-tag">
                    Status: {filters.status}
                    <X size={14} onClick={() => handleFilterChange('status', '')} />
                  </span>
                )}
                {filters.action && (
                  <span className="filter-tag">
                    Action: {filters.action}
                    <X size={14} onClick={() => handleFilterChange('action', '')} />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs List */}
      {!timeline || !timeline.timeline || timeline.timeline.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">📭 No trade logs found</p>
          <p className="empty-subtitle">
            {hasActiveFilters()
              ? '🔍 Try adjusting your filters or clearing them'
              : 'Logs will appear here once trades are executed'}
          </p>
          {hasActiveFilters() && (
            <button className="reset-empty-btn" onClick={handleReset}>
              <RefreshCw size={16} /> Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="logs-list">
          {timeline.timeline.map((log: any, index: number) => (
            <div key={log.id || index} className="log-card">
              <div className="log-content">
                <div className="log-grid">
                  <div className="log-field">
                    <div className="field-label">CLIENT</div>
                    <div className="field-value client">
                      {log.clientCode || log.client_code || 'N/A'}
                    </div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">ACTION</div>
                    <div className="field-value">{log.action || 'N/A'}</div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">TRACE ID</div>
                    <div
                      className={`field-value trace-id ${(log.traceId || log.trace_id) ? 'clickable' : ''}`}
                      onClick={() => (log.traceId || log.trace_id) && handleTraceClick(log.traceId || log.trace_id)}
                      style={{
                        cursor: (log.traceId || log.trace_id) ? 'pointer' : 'default',
                        opacity: (log.traceId || log.trace_id) ? 1 : 0.5
                      }}
                      title={log.traceId || log.trace_id || 'N/A'}
                    >
                      {getTraceIdDisplay(log.traceId || log.trace_id)}
                    </div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">SPAN ID</div>
                    <div
                      className={`field-value span-id ${(log.spanId || log.span_id) ? 'clickable' : ''}`}
                      onClick={() => (log.spanId || log.span_id) && handleSpanClick(log.spanId || log.span_id)}
                      style={{
                        cursor: (log.spanId || log.span_id) ? 'pointer' : 'default',
                        opacity: (log.spanId || log.span_id) ? 1 : 0.5
                      }}
                      title={log.spanId || log.span_id || 'N/A'}
                    >
                      {getSpanIdDisplay(log.spanId || log.span_id)}
                    </div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">STATUS</div>
                    <div className="field-value">
                      <span
                        className={`status-badge ${(log.status || '').toLowerCase()}`}
                        style={{
                          background: getStatusColor(log.status) + '20',
                          color: getStatusColor(log.status),
                          borderColor: getStatusColor(log.status)
                        }}
                      >
                        {log.status || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  <div className="log-field">
                    <div className="field-label">CREATED AT</div>
                    <div className="field-value time">
                      {formatDate(log.created_at?.$date || log.createdAt || log.requestTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && modalType && (
        <LogsModal
          id={selectedId}
          type={modalType}
          fullData={modalType === 'trace' ? traceLogsData : spanLogsData}
          loading={loadingData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};