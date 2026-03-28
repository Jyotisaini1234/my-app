import React, { useEffect, useRef, useState } from 'react';
import {FolderArchive, Download, Upload, Trash2, RefreshCw,HardDrive, FileArchive, CheckCircle, XCircle, Loader2, Info,} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchArchiveList, fetchLokiStatus,downloadArchive, deleteArchive, uploadArchive,} from '../../store/slice/logExportSlice/logExportSlice';
import './LogExportPage.scss';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }
let toastId = 0;

function parseSizeToBytes(sizeStr: string): number {
  if (!sizeStr) return 0;
  const s = sizeStr.trim().toUpperCase();
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  if (s.endsWith('G')) return num * 1024 * 1024 * 1024;
  if (s.endsWith('M')) return num * 1024 * 1024;
  if (s.endsWith('K')) return num * 1024;
  return num; // raw bytes
}
 
function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024)        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024)               return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}
export const LogExportPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { files, lokiStatus, isFetched, loadingList, loadingStatus, actionTarget, actionType, error } =
    useAppSelector(s => s.logExport);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toasts, setToasts]               = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalArchiveSize: string = (() => {
    if (loadingList || files.length === 0) return '—';
    const totalBytes = files.reduce((acc, f) => acc + parseSizeToBytes(f.size), 0);
    return formatBytes(totalBytes);
  })();

  useEffect(() => {
    if (isFetched) return;
    dispatch(fetchArchiveList());
    dispatch(fetchLokiStatus());
  }, [isFetched, dispatch]);

  useEffect(() => {
    if (error) toast(error, 'error');
  }, [error]);

  const toast = (msg: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const handleDownload = async (filename: string) => {
    const result = await dispatch(downloadArchive(filename));
    if (downloadArchive.fulfilled.match(result)) {
      toast(`Downloaded: ${filename}`, 'success');
    }
  };

  const handleDelete = async (filename: string) => {
    setConfirmDelete(null);
    const result = await dispatch(deleteArchive(filename));
    if (deleteArchive.fulfilled.match(result)) {
      toast(`Deleted: ${filename}`, 'success');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.tar.gz')) { toast('Only .tar.gz files allowed', 'error'); return; }
    const result = await dispatch(uploadArchive(file));
    if (uploadArchive.fulfilled.match(result)) {
      toast(`Uploaded: ${file.name}`, 'success');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isBusy = (filename: string) => actionTarget === filename;

  return (
    <div className="log-export">

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.type === 'success' && <CheckCircle size={13} />}
            {t.type === 'error'   && <XCircle     size={13} />}
            {t.type === 'info'    && <Info         size={13} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="log-export__header">
        <div className="log-export__title-wrap">
          <div className="log-export__title-icon"><FolderArchive size={20} /></div>
          <div>
            <h2>Log Archive Manager</h2>
            <p>Download, upload Loki log archives</p>
          </div>
        </div>
        <div className="log-export__header-actions">
          <button className="btn btn--ghost"  onClick={() => { dispatch(fetchArchiveList()); dispatch(fetchLokiStatus()); }} disabled={loadingList}>
            <RefreshCw size={13} className={loadingList ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn--primary" onClick={() => fileInputRef.current?.click()} disabled={actionType === 'upload'} >
            {actionType === 'upload' ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
            {actionType === 'upload' ? 'Uploading…' : 'Upload'}
          </button>
          <input ref={fileInputRef} type="file" accept=".tar.gz" className="hidden-input" onChange={handleUpload} />
        </div>
      </div>

      {/* Status cards */}
      <div className="status-cards">
        <div className="status-card">
          <div className="status-card__icon status-card__icon--blue"><HardDrive size={16} /></div>
          <div>
            <span className="status-card__label">Chunks Size</span>
             <span className="status-card__value">
              {loadingList ? '…' : totalArchiveSize}
            </span>
          </div>
        </div>
        <div className="status-card">
          <div className="status-card__icon status-card__icon--orange"><FolderArchive size={16} /></div>
          <div>
            <span className="status-card__label">Archives</span>
            <span className="status-card__value">{loadingList ? '…' : files.length}</span>
          </div>
        </div>
      </div>

      {/* Archive list */}
      <div className="archive-panel">
        <div className="archive-panel__head">
          <h3>Remote Archives</h3>
          <span className="archive-panel__count">{files.length} files</span>
        </div>

        {loadingList ? (
          <div className="archive-panel__loading">
            <Loader2 size={22} className="spin" />
            <span>Loading archives…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="archive-panel__empty">
            <FolderArchive size={32} />
            <span>No archives found on remote server</span>
          </div>
        ) : (
          <div className="archive-table">
            <div className="archive-table__header">
              <span>Filename</span>
              <span>Actions</span>
            </div>
            {files.map(f => (
              <div key={f.filename} className="archive-table__row">
                <div className="archive-table__name">
                  <FileArchive size={13} />
                  <span title={f.filename}>{f.filename}</span>
                </div>
                <div className="archive-table__actions">
                  <button className="action-btn action-btn--download" onClick={() => handleDownload(f.filename)} disabled={isBusy(f.filename)} title="Download" >
                    {isBusy(f.filename) && actionType === 'download'
                      ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
                    Download
                  </button>
                  <button className="action-btn action-btn--delete"  onClick={() => setConfirmDelete(f.filename)} disabled={isBusy(f.filename)} title="Delete" >
                    {isBusy(f.filename) && actionType === 'delete'
                      ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__icon modal__icon--danger"><Trash2 size={20} /></div>
            <h3>Delete Archive?</h3>
            <p>Permanently delete <strong>{confirmDelete}</strong> from the remote server? This cannot be undone.</p>
            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};