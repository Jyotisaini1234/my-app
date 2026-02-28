import React, { useEffect, useRef, useState } from 'react';
import {FolderArchive, Download, Upload, Trash2, RefreshCw, HardDrive, FileArchive, AlertTriangle, CheckCircle, XCircle, Loader2, RotateCcw, Info,} from 'lucide-react';
import { TRADE_BASE } from '../../utils/ApiConstants';
import './LogExportPage.scss';

const BASE = `${TRADE_BASE}/api/logs/export`;

interface ArchiveFile {
  filename: string;
  size: string;
  lastModified: string;
}

interface LokiStatus {
  chunksSize: string;
  indexSize: string;
}

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }

let toastId = 0;

const api = async (url: string, opts?: RequestInit) => {
  const res  = await fetch(url, { credentials: 'include', ...opts });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
  return json;
};

export const LogExportPage: React.FC = () => {
  const [files,setFiles]  = useState<ArchiveFile[]>([]);
  const [lokiStatus,setLokiStatus] = useState<LokiStatus | null>(null);
  const [loadingList,setLoadingList] = useState(false);
  const [loadingStatus,setLoadingStatus] = useState(false);
  const [actionTarget,setActionTarget] = useState<string | null>(null);
  const [actionType,setActionType] = useState<'download' | 'delete' | 'restore' | null>(null);
  const [uploading,setUploading] = useState(false);
  const [confirmDelete,setConfirmDelete] = useState<string | null>(null);
  const [confirmRestore,setConfirmRestore] = useState<string | null>(null);
  const [toasts,setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = (msg: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const data = await api(`${BASE}/list-remote`);
      setFiles(data.files || []);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoadingList(false); }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await api(`${BASE}/loki-data-status`);
      setLokiStatus({ chunksSize: data.chunksSize, indexSize: data.indexSize });
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoadingStatus(false); }
  };

  useEffect(() => { fetchList(); fetchStatus(); }, []);

  const handleDownload = async (filename: string) => {
    setActionTarget(filename); setActionType('download');
    try {
      const res = await fetch(`${BASE}/download-remote/${encodeURIComponent(filename)}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast(`Downloaded: ${filename}`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActionTarget(null); setActionType(null); }
  };

  const handleDelete = async (filename: string) => {
    setConfirmDelete(null);
    setActionTarget(filename); setActionType('delete');
    try {
      await api(`${BASE}/delete-remote/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      toast(`Deleted: ${filename}`, 'success');
      setFiles(p => p.filter(f => f.filename !== filename));
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActionTarget(null); setActionType(null); }
  };


  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.tar.gz')) { toast('Only .tar.gz files allowed', 'error'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch(`${BASE}/upload-archive`, { method: 'POST', credentials: 'include', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Upload failed');
      toast(`Uploaded: ${file.name}`, 'success');
      fetchList();
    } catch (e: any) { toast(e.message, 'error'); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          <button className="btn btn--ghost" onClick={() => { fetchList(); fetchStatus(); }} disabled={loadingList}>
            <RefreshCw size={13} className={loadingList ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn--primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
            {uploading ? 'Uploading…' : 'Upload'}
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
            <span className="status-card__value">{loadingStatus ? '…' : (lokiStatus?.chunksSize ?? '—')}</span>
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
                    {isBusy(f.filename) && actionType === 'download' ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
                    Download
                  </button>
                  <button className="action-btn action-btn--delete" onClick={() => setConfirmDelete(f.filename)}disabled={isBusy(f.filename)} title="Delete" >
                    {isBusy(f.filename) && actionType === 'delete' ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Delete */}
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