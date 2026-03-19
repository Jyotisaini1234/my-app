import React, { useEffect, useState } from 'react';
import {Alert, Box, Button, Chip, CircularProgress, IconButton, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,} from '@mui/material';
import { XCircle, AlertCircle } from 'lucide-react';
import './TradeHistoryPage.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTradeHistory, setFilters, clearError } from '../../store/slice/tradeHistorySlice/tradeHistorySlice';
import { brokerService } from '../../services/api'; 
import { TradeLogEntry } from '../../types/type';
import { CancelModal } from '../../components/Modal/CancelModal/CancelModal';


function toBackendDate(htmlDate: string): string {
  if (!htmlDate) return '';
  const [yyyy, mm, dd] = htmlDate.split('-');
  if (!yyyy || !mm || !dd) return '';
  return `${dd}-${mm}-${yyyy}`;
}

function toInputDate(backendDate: string): string {
  if (!backendDate) return '';
  const [dd, mm, yyyy] = backendDate.split('-');
  if (!dd || !mm || !yyyy) return '';
  return `${yyyy}-${mm}-${dd}`;
}


function getUniqueOrderId(row: TradeLogEntry): string | undefined {
  return row.uniqueOrderId || (row as any).unique_order_id;
}

function isCancellable(row: TradeLogEntry): boolean {
  const status = row.status?.toLowerCase();
  const uid    = getUniqueOrderId(row);
  return (
    row.action === 'PLACE_ORDER' &&
    !!uid &&
    (status === 'success' || status === 'open' ||
     status === 'estimated' || status === 'executing')
  );
}

function getCancelBlockReason(row: TradeLogEntry): string {
  const uid    = getUniqueOrderId(row);
  const status = row.status?.toLowerCase();
  if (row.action !== 'PLACE_ORDER') return 'Sirf PLACE orders cancel ho sakte hain';
  if (!uid)                          return 'Order ID missing — cancel possible nahi';
  if (status === 'error')            return 'Order place hi nahi hua tha (ERROR)';
  if (status === 'cancelled')        return 'Yeh order pehle se cancel ho chuka hai';
  if (status === 'complete' || status === 'executed') return 'Order execute ho chuka hai — cancel nahi ho sakta';
  return 'Is status mein cancel allowed nahi';
}


const statusColor = ( s?: string): 'default' | 'warning' | 'info' | 'success' | 'error' => {
  switch (s?.toLowerCase()) {
    case 'success':
    case 'executed':
    case 'complete':   return 'success';
    case 'executing':
    case 'open':       return 'info';
    case 'estimated':  return 'warning';
    case 'failed':
    case 'error':      return 'error';
    case 'cancelled':  return 'default';
    default:           return 'default';
  }
};


export const TradeHistoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error, filters } = useAppSelector((s) => s.tradeHistory);
  const user     = useAppSelector((s) => s.auth.user);
  const isMaster = user?.role === 'MASTER';
  const [typeFilter,   setTypeFilter]   = useState<string>(filters.type || 'All');
  const [clientInput,  setClientInput]  = useState<string>(filters.clientCode || '');
  const [startInput,   setStartInput]   = useState<string>(toInputDate(filters.startDate));
  const [endInput,     setEndInput]     = useState<string>(toInputDate(filters.endDate));
  const [cancelTarget, setCancelTarget] = useState<TradeLogEntry | null>(null);
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState<string | null>(null);
  const [cancelSuccess,setCancelSuccess]= useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTradeHistory({}));
  }, [dispatch]);

  const applyAndFetch = () => {
    const sd = toBackendDate(startInput);
    const ed = toBackendDate(endInput);
    const cc = isMaster ? clientInput.trim().toUpperCase() : '';
    dispatch(clearError());
    dispatch(setFilters({ type: typeFilter, startDate: sd, endDate: ed, clientCode: cc }));
    dispatch(fetchTradeHistory({
      startDate:  sd || undefined,
      endDate:    ed || undefined,
      clientCode: cc || undefined,
    }));
  };

  const handleCancelConfirm = async () => {
    const uid        = cancelTarget ? getUniqueOrderId(cancelTarget) : undefined;
    const clientCode = cancelTarget?.clientCode;

    if (!uid || !clientCode) {
      setCancelError('Order ID ya Client Code missing — cancel possible nahi');
      setCancelTarget(null);
      return;
    }
    setCancelling(true);
    setCancelError(null);
    setCancelSuccess(null);
    try {
      const res: any = await brokerService.cancelOrder({
        clientcode:    clientCode,
        uniqueorderid: uid,
      });
      if (res?.status === 'SUCCESS' || res?.status === 'success') {
        setCancelSuccess(
          `Order cancel success— Client: ${clientCode}, Order: ${uid}`
        );
      } else {
        const reason = res?.message || res?.error || 'Unknown reason';
        setCancelError(`Cancel failed: ${reason}`);
      }
      setCancelTarget(null);
      applyAndFetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Server error';
      setCancelError(`Cancel: ${msg}`);
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  const filteredData = data.filter((row) => {
    if (typeFilter === 'BUY')  return row.buyOrSell === 'BUY';
    if (typeFilter === 'SELL') return row.buyOrSell === 'SELL';
    return true;
  });

  const handleClear = () => {
    setTypeFilter('All');
    setClientInput('');
    setStartInput('');
    setEndInput('');
    dispatch(clearError());
    dispatch(setFilters({ type: 'All', clientCode: '', startDate: '', endDate: '' }));
    dispatch(fetchTradeHistory({}));
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>Trade History</Typography>
      </Stack>

      {/* ── Filters ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Type</Typography>
          <Select size="small" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="All">All Trade Types</MenuItem>
            <MenuItem value="BUY">Buy (Place)</MenuItem>
            <MenuItem value="SELL">Sell (Cancel)</MenuItem>
          </Select>
        </Box>

        {isMaster && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Client Code</Typography>
            <TextField  size="small" placeholder="e.g. SOAR1439" value={clientInput} onChange={(e) => { setClientInput(e.target.value.toUpperCase()); if (error) dispatch(clearError()); }} onKeyDown={(e) => e.key === 'Enter' && applyAndFetch()} error={!!error && !!clientInput} sx={{ width: 160 }} />
          </Box>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>From</Typography>
          <TextField type="date" size="small" value={startInput} onChange={(e) => setStartInput(e.target.value)} sx={{ width: 170 }} inputProps={{ max: endInput || undefined }} />
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>To</Typography>
          <TextField type="date" size="small" value={endInput} onChange={(e) => setEndInput(e.target.value)} sx={{ width: 170 }} inputProps={{ min: startInput || undefined }} />
        </Box>

        <Button variant="contained" size="small" onClick={applyAndFetch} sx={{ textTransform: 'none', height: 40, bgcolor: '#1a2b5c', color: 'white' }}>Apply</Button>
        <Button variant="outlined"  size="small" onClick={handleClear}   sx={{ textTransform: 'none', height: 40, color: '#1a2b5c', border: '1px solid #1a2b5c' }}>Clear</Button>
      </Paper>

      {/* ── Alerts ── */}
      {error && (
        <Alert severity="error" icon={<AlertCircle size={18} />} onClose={() => dispatch(clearError())} sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {cancelSuccess && (
        <Alert severity="success" onClose={() => setCancelSuccess(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {cancelSuccess}
        </Alert>
      )}

      {cancelError && (
        <Alert severity="error" onClose={() => setCancelError(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {cancelError}
        </Alert>
      )}

      {/* ── Table ── */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="error" fontWeight={600} mb={1}>Invalid Client Code</Typography>
            <Typography color="text.secondary" fontSize={14}>Please enter a valid client code and try again.</Typography>
          </Box>
        ) : filteredData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No trade records found.</Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Client', 'Client Name', 'Action', 'Buy/Sell', 'Symbol', 'Order ID', 'Date', 'Status', 'Qty', 'Cancel'].map((col) => (
                  <TableCell key={col} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, i) => {
                const cancellable = isCancellable(row);
                const blockReason = cancellable ? '' : getCancelBlockReason(row);

                return (
                  <TableRow key={row.id || i} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{row.clientCode || '—'}</Typography>
                    </TableCell>

                    <TableCell>{row.clientName || '—'}</TableCell>

                    <TableCell>
                      <Chip label={row.action === 'PLACE_ORDER' ? 'PLACE' : row.action === 'CANCEL_ORDER' ? 'CANCEL' : row.action || '—'} size="small"  color={row.action === 'PLACE_ORDER' ? 'success' : row.action === 'CANCEL_ORDER' ? 'error' : 'default'} variant="outlined"  />
                    </TableCell>

                    <TableCell>
                      {row.buyOrSell
                        ? <Chip label={row.buyOrSell} size="small" color={row.buyOrSell === 'BUY' ? 'success' : 'error'} variant="outlined" />
                        : '—'}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize={11}>{row.symbol || '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize={11}>
                        {getUniqueOrderId(row) || 'Invalid Order'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </TableCell>

                    <TableCell>
                      <Chip label={row.status || 'Unknown'} size="small" color={statusColor(row.status)} />
                    </TableCell>

                    <TableCell>{row.quantity || '—'}</TableCell>

                    <TableCell>
                      <Tooltip title={cancellable ? `Cancel: ${row.clientCode} — ${getUniqueOrderId(row)}` : blockReason}>
                        <span>
                          <IconButton size="small" color="error" disabled={!cancellable} onClick={() => { setCancelError(null); setCancelSuccess(null); setCancelTarget(row); }} >
                            <XCircle size={16} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {cancelTarget && (
        <CancelModal row={cancelTarget} onConfirm={handleCancelConfirm}  onClose={() => { if (!cancelling) setCancelTarget(null); }} loading={cancelling} />
      )}
    </Box>
  );
};