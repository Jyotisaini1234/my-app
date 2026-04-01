import React, { useEffect, useRef, useState } from 'react';
import StorageIcon from '@mui/icons-material/Storage';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HardDriveIcon from '@mui/icons-material/Hardware';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoopIcon from '@mui/icons-material/Loop';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchArchiveList, fetchLokiStatus, downloadArchive, deleteArchive, uploadArchive, restoreArchive,} from '../../store/slice/logExportSlice/logExportSlice';
import './LogExportPage.scss';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; msg: string; type: ToastType }
type ModalAction = { type: 'delete' | 'restore'; filename: string };
let _tid = 0;

const toBytes = (s: string) => {
  const u = s?.trim().toUpperCase() ?? '';
  const n = parseFloat(u);
  if (isNaN(n)) return 0;
  if (u.endsWith('G')) return n * 1024 ** 3;
  if (u.endsWith('M')) return n * 1024 ** 2;
  if (u.endsWith('K')) return n * 1024;
  return n;
};

const fmtBytes = (b: number) =>
  b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(1)} GB`
  : b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB`
  : b >= 1024 ? `${(b / 1024).toFixed(1)} KB`
  : `${b} B`;

const Spin = () => <LoopIcon className="spin" style={{ fontSize: 14 }} />;

export const LogExportPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { files, lokiStatus, loadingList, loadingStatus, actionTarget, actionType, error } =
    useAppSelector(s => s.logExport);

  const [modal,  setModal]  = useState<ModalAction | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { dispatch(fetchArchiveList()); dispatch(fetchLokiStatus()); }, [dispatch]);
  useEffect(() => { if (error) addToast(error, 'error'); }, [error]);

  const addToast = (msg: string, type: ToastType = 'info') => {
    const id = ++_tid;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };

  const isBusy  = (f: string) => actionTarget === f;
  const isEmpty = (s: string) => toBytes(s) < 1000;
  const totalBytes = files.reduce((a, f) => a + toBytes(f.size), 0);
  const realCount  = files.filter(f => !isEmpty(f.size)).length;
  const emptyCount = files.filter(f =>  isEmpty(f.size)).length;
  const uploading  = actionType === 'upload' || actionType === 'restore';

  const handleDownload = async (filename: string) => {
    const r = await dispatch(downloadArchive(filename));
    if (downloadArchive.fulfilled.match(r)) addToast(`Downloaded: ${filename}`, 'success');
  };

  const handleDelete = async (filename: string) => {
    setModal(null);
    const r = await dispatch(deleteArchive({ filename, purgeLoki: true }));
    if (deleteArchive.fulfilled.match(r)) {
      addToast(`Deleted + purged: ${filename}`, 'success');
      setTimeout(() => dispatch(fetchLokiStatus()), 2000);
    }
  };

  const handleRestore = async (filename: string) => {
    setModal(null);
    addToast(`Restoring ${filename}…`, 'info');
    const r = await dispatch(restoreArchive(filename));
    if (restoreArchive.fulfilled.match(r)) {
      addToast(`✓ Restored: ${filename}`, 'success');
      setTimeout(() => dispatch(fetchLokiStatus()), 5000);
    } else {
      addToast(`Restore failed: ${filename}`, 'error');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.tar.gz')) { addToast('Only .tar.gz allowed', 'error'); return; }
    addToast(`Uploading ${file.name}…`, 'info');
    const ur = await dispatch(uploadArchive(file));
    if (uploadArchive.fulfilled.match(ur)) {
      addToast('Uploaded — restoring…', 'info');
      const rr = await dispatch(restoreArchive(file.name));
      if (restoreArchive.fulfilled.match(rr)) {
        addToast(`✓ ${file.name} restored!`, 'success');
        dispatch(fetchArchiveList());
        setTimeout(() => dispatch(fetchLokiStatus()), 5000);
      } else addToast('Upload done — restore failed', 'warning');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="lep">

      {/* Toasts */}
      <div className="lep-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`lep-toast lep-toast--${t.type}`}>
            {t.type === 'success' && <CheckCircleIcon style={{ fontSize: 14 }} />}
            {t.type === 'error'   && <ErrorIcon       style={{ fontSize: 14 }} />}
            {t.type === 'warning' && <WarningIcon     style={{ fontSize: 14 }} />}
            {t.type === 'info'    && <InfoOutlinedIcon style={{ fontSize: 14 }} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="lep__top">
        <div className="lep__top-left">
          <div className="lep__breadcrumb">
            <span>Logs</span>
            <ChevronRightIcon style={{ fontSize: 12 }} />
            <span className="lep__breadcrumb--active">Archive Manager</span>
          </div>
          <h1 className="lep__title">Log Archive Manager</h1>
          <p className="lep__subtitle">Manage remote Loki archives — restore deleted logs by re-uploading</p>
        </div>
        <div className="lep__top-actions">
          <button className="lep-btn lep-btn--ghost" onClick={() => { dispatch(fetchArchiveList()); dispatch(fetchLokiStatus()); }} disabled={loadingList}>
            <RefreshIcon className={loadingList ? 'spin' : ''} style={{ fontSize: 14 }} /> Refresh
          </button>
          <button className="lep-btn lep-btn--primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading
              ? <><Spin /> {actionType === 'upload' ? 'Uploading…' : 'Restoring…'}</>
              : <><UploadIcon style={{ fontSize: 14 }} /> Upload &amp; Restore</>}
          </button>
          <input ref={fileRef} type="file" accept=".tar.gz" className="lep__hidden-input" onChange={handleUpload} />
        </div>
      </div>

      {/* Stats */}
      <div className="lep-stats">
        {[
          { icon: <StorageIcon />,    label: 'Live Loki Size',  value: lokiStatus?.totalLokiSize, loading: loadingStatus, mod: 'blue'   },
          { icon: <DataUsageIcon />,  label: 'Chunks Size',     value: lokiStatus?.chunksSize,    loading: loadingStatus, mod: 'teal'   },
          { icon: <Inventory2Icon />, label: 'Total Archives',  value: `${files.length} files`,   loading: loadingList,   mod: 'orange' },
          { icon: <HardDriveIcon />,  label: 'Archive Storage', value: fmtBytes(totalBytes),      loading: loadingList,   mod: 'purple' },
        ].map(s => (
          <div key={s.label} className={`lep-stat lep-stat--${s.mod}`}>
            <div className="lep-stat__icon">{s.icon}</div>
            <div className="lep-stat__body">
              <span className="lep-stat__label">{s.label}</span>
              <span className="lep-stat__value">{s.loading ? <Spin /> : (s.value || '—')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="lep-info">
        <InfoOutlinedIcon style={{ fontSize: 13, flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Delete</strong> removes archive + purges Loki logs ·{' '}
          <strong>Restore</strong> re-loads archive into Loki ·{' '}
          <strong>Upload</strong> re-uploads + auto-restores
        </span>
      </div>

      {/* Panel */}
      <div className="lep-panel">
        <div className="lep-panel__head">
          <div className="lep-panel__head-left">
            <FolderZipIcon style={{ fontSize: 16 }} />
            <h2>Remote Archives</h2>
            {!loadingList && (
              <div className="lep-panel__pills">
                {realCount  > 0 && <span className="lep-pill lep-pill--green">{realCount} with data</span>}
                {emptyCount > 0 && <span className="lep-pill lep-pill--amber">{emptyCount} empty</span>}
              </div>
            )}
          </div>
          <span className="lep-panel__count">{files.length} files</span>
        </div>

        {loadingList ? (
          <div className="lep-panel__state">
            <Spin /><span>Loading archives…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="lep-panel__state">
            <FolderZipIcon style={{ fontSize: 36, opacity: 0.25 }} />
            <span>No archives found on remote server</span>
            <p>Run the backup script to create archives</p>
          </div>
        ) : (
          <div className="lep-table">
            <div className="lep-table__head">
              <span>Archive File</span>
              <span>Size</span>
              <span>Actions</span>
            </div>

            {files.map(f => {
              const busy    = isBusy(f.filename);
              const empty   = isEmpty(f.size);
              const szBytes = toBytes(f.size);

              return (
                <div
                  key={f.filename}
                  className={['lep-table__row', empty ? 'lep-table__row--empty' : '', busy ? 'lep-table__row--busy' : ''].filter(Boolean).join(' ')}
                >
                  <div className="lep-table__file">
                    <div className={`lep-table__file-icon${empty ? ' lep-table__file-icon--empty' : ''}`}>
                      <FolderZipIcon style={{ fontSize: 14 }} />
                    </div>
                    <span className="lep-table__file-name" title={f.filename}>{f.filename}</span>
                  </div>

                  <div className="lep-table__cell">
                    {empty
                      ? <span className="lep-table__size-empty"><WarningIcon style={{ fontSize: 11 }} /> Empty</span>
                      : <span className="lep-table__size">{szBytes >= 1024 ** 2 ? `${(szBytes / 1024 ** 2).toFixed(1)} MB` : f.size}</span>}
                  </div>

                  <div className="lep-table__actions">
                    <button className="lep-action lep-action--download" onClick={() => handleDownload(f.filename)} disabled={busy}>
                      {busy && actionType === 'download' ? <Spin /> : <DownloadIcon style={{ fontSize: 12 }} />} Download
                    </button>
                    <button className="lep-action lep-action--restore" onClick={() => setModal({ type: 'restore', filename: f.filename })} disabled={busy || empty}>
                      {busy && actionType === 'restore' ? <Spin /> : <RestoreIcon style={{ fontSize: 12 }} />} Restore
                    </button>
                    <button className="lep-action lep-action--delete" onClick={() => setModal({ type: 'delete', filename: f.filename })} disabled={busy}>
                      {busy && actionType === 'delete' ? <Spin /> : <DeleteIcon style={{ fontSize: 12 }} />} Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {modal?.type === 'delete' && (
        <div className="lep-overlay" onClick={() => setModal(null)}>
          <div className="lep-modal lep-modal--danger" onClick={e => e.stopPropagation()}>
            <div className="lep-modal__icon"><DeleteIcon style={{ fontSize: 22 }} /></div>
            <h3>Delete Archive?</h3>
            <p><code>{modal.filename}</code> will be permanently removed from the remote server.</p>
            <div className="lep-modal__alert lep-modal__alert--danger">
              <WarningIcon style={{ fontSize: 13, flexShrink: 0 }} />
              <span>Loki logs will also be <strong>purged</strong> and become inaccessible. Re-upload to recover.</span>
            </div>
            <div className="lep-modal__foot">
              <button className="lep-btn lep-btn--ghost"  onClick={() => setModal(null)}>Cancel</button>
              <button className="lep-btn lep-btn--danger" onClick={() => handleDelete(modal.filename)}>
                <DeleteIcon style={{ fontSize: 13 }} /> Delete + Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {modal?.type === 'restore' && (
        <div className="lep-overlay" onClick={() => setModal(null)}>
          <div className="lep-modal lep-modal--restore" onClick={e => e.stopPropagation()}>
            <div className="lep-modal__icon"><RestoreIcon style={{ fontSize: 22 }} /></div>
            <h3>Restore Logs to Loki?</h3>
            <p><code>{modal.filename}</code> will be extracted back into Loki.</p>
            <div className="lep-modal__alert lep-modal__alert--info">
              <InfoOutlinedIcon style={{ fontSize: 13, flexShrink: 0 }} />
              <span>Loki will <strong>stop briefly</strong>, then restart. This takes ~30–60 seconds.</span>
            </div>
            <div className="lep-modal__foot">
              <button className="lep-btn lep-btn--ghost"   onClick={() => setModal(null)}>Cancel</button>
              <button className="lep-btn lep-btn--restore" onClick={() => handleRestore(modal.filename)}>
                <RestoreIcon style={{ fontSize: 13 }} /> Restore Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};