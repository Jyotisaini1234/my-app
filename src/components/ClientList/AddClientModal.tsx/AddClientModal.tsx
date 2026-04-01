import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, X, Plus, Trash2, ChevronDown, Search, Check, User, Pencil } from 'lucide-react';
import './AddClientModal.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClients, updateClient } from '../../../store/slice/clientsSlice/clientsSlice';
import { clientService } from '../../../services/api';
import { useToast } from '../../../context/ToastContext/Toastcontext';
import { ClientForm } from '../../../types/type';

interface AddClientModalProps {
  onClose: () => void;
}

// ─── Broker config ────────────────────────────────────────────────────────────
const KNOWN_BROKERS = ['MOTILAL', 'SHOONYA'] as const;
type KnownBroker = typeof KNOWN_BROKERS[number];
type BrokerKey   = KnownBroker | 'CUSTOM';

type BrokerField = {
  key: string; label: string; placeholder: string;
  required: boolean; type?: 'password'; hint?: string;
};

const BROKER_FIELDS: Record<KnownBroker, BrokerField[]> = {
  MOTILAL: [
    { key: 'userId',     label: 'User ID',      placeholder: 'e.g. SOAR1321',                          required: true  },
    { key: 'password',   label: 'Password',      placeholder: 'e.g. Soar#1321',                         required: true,  type: 'password' },
    { key: 'apiKey',     label: 'API Key',       placeholder: 'e.g. fEFNmRugttmNxU9j',                  required: true  },
    { key: 'totpSecret', label: 'TOTP Secret',   placeholder: 'e.g. XOZL72EXAH25H4JX…',                required: true,  hint: 'Base32 secret from authenticator app' },
    { key: 'totpToken',  label: 'TOTP Token',    placeholder: 'e.g. 802975',                            required: false, hint: '6-digit OTP (auto-generated on login)' },
    { key: 'twoFa',      label: '2FA / PAN',     placeholder: 'e.g. AKBPA8272D',                        required: false, hint: 'PAN card number used as 2FA' },
  ],
  SHOONYA: [
    { key: 'userId',     label: 'User ID',       placeholder: 'e.g. FA62080',                           required: true  },
    { key: 'password',   label: 'Password',      placeholder: 'SHA256 hashed password',                 required: true,  type: 'password', hint: "sha256('yourPassword')" },
    { key: 'apiKey',     label: 'API Secret',    placeholder: 'e.g. 1c81c744e1aba224…',                 required: true,  hint: 'From Shoonya developer portal' },
    { key: 'totpSecret', label: 'TOTP Secret',   placeholder: 'e.g. SX447C4V533HX277Z7642ZUKF5EL5465', required: true,  hint: 'Base32 secret from authenticator app' },
    { key: 'imei',       label: 'IMEI',          placeholder: 'e.g. abc1234',                           required: false, hint: 'Any string — used as device identifier' },
  ],
};

// Generic fields for any custom broker — all optional
const CUSTOM_BROKER_FIELDS: BrokerField[] = [
  { key: 'userId',     label: 'User ID',     placeholder: 'Broker login user ID',     required: false },
  { key: 'password',   label: 'Password',    placeholder: 'Broker password',           required: false, type: 'password' },
  { key: 'apiKey',     label: 'API Key',     placeholder: 'API key / secret',          required: false },
  { key: 'totpSecret', label: 'TOTP Secret', placeholder: 'Base32 TOTP secret',        required: false, hint: 'Base32 secret from authenticator app' },
  { key: 'totpToken',  label: 'TOTP Token',  placeholder: '6-digit OTP',               required: false },
  { key: 'twoFa',      label: '2FA / PAN',   placeholder: 'PAN or 2FA value',          required: false },
  { key: 'imei',       label: 'IMEI',        placeholder: 'Device identifier string',  required: false },
];

const getBrokerFields = (broker: BrokerKey): BrokerField[] => {
  if (broker === 'CUSTOM') return CUSTOM_BROKER_FIELDS;
  return BROKER_FIELDS[broker] ?? [];
};

// ─── Client form fields ───────────────────────────────────────────────────────
const EMPTY_FORM: ClientForm = {
  name: '',
  client_code: '', user_id: '', password: '', api_key: '',
  authorization: '', totp_secret: '', totp_token: '', two_fa: '',
  email: '', phone: '', is_active: true, is_master: false,
};

const CLIENT_TEXT_FIELDS: {
  key: keyof Omit<ClientForm, 'is_active' | 'is_master'>;
  label: string; placeholder: string; hint?: string;
}[] = [
  { key: 'name',        label: 'Name',        placeholder: 'e.g. Jyoti Saini' }, 
  { key: 'client_code', label: 'Client Code', placeholder: 'e.g. SOAR1210' },
  { key: 'email',       label: 'Email',       placeholder: 'e.g. user@example.com' },
  { key: 'phone',       label: 'Phone',       placeholder: 'e.g. 9876543210', hint: '10 digit mobile' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrokerEntry {
  id:         string;
  broker:     BrokerKey | '';
  customName: string;          // only used when broker === 'CUSTOM'
  fields:     Record<string, string>;
  showPwd:    Record<string, boolean>;
  expanded:   boolean;
}

type PanelMode = 'new-client' | 'add-broker';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid         = () => Math.random().toString(36).slice(2, 8);
const emptyBroker = (): BrokerEntry => ({
  id: uid(), broker: '', customName: '', fields: {}, showPwd: {}, expanded: true,
});

// Returns the final broker key to use in the payload
// e.g. MOTILAL | SHOONYA | "ZERODHA" (custom name uppercased)
const resolvedBrokerKey = (entry: BrokerEntry): string => {
  if (entry.broker === 'CUSTOM') return entry.customName.trim().toUpperCase();
  return entry.broker;
};

// Header label shown in the collapsible block
const brokerDisplayName = (entry: BrokerEntry): string => {
  if (!entry.broker)           return 'Select Broker';
  if (entry.broker === 'MOTILAL') return 'Motilal Oswal';
  if (entry.broker === 'SHOONYA') return 'Shoonya (Finvasia)';
  // CUSTOM
  return entry.customName.trim() || 'Custom Broker';
};

const getEnabledBrokers = (client: any): string[] => {
  const b = client?.brokers ?? {};
  return Object.keys(b).filter(k => b[k]?.enabled !== false);
};

// ─── BrokerSelect chip row ────────────────────────────────────────────────────
const BrokerSelect: React.FC<{
  value:    BrokerKey | '';
  disabled: string[];           // already-chosen known broker names
  onChange: (b: BrokerKey) => void;
}> = ({ value, disabled, onChange }) => (
  <div className="acm__broker-select">
    {KNOWN_BROKERS.map(b => {
      const isDisabled = disabled.includes(b);
      const isActive   = value === b;
      return (
        <button
          key={b}
          type="button"
          className={[
            'acm__broker-chip',
            `acm__broker-chip--${b.toLowerCase()}`,
            isActive   ? 'acm__broker-chip--active'   : '',
            isDisabled ? 'acm__broker-chip--disabled' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => !isDisabled && onChange(b)}
          disabled={isDisabled}
          title={isDisabled ? 'Already added' : b}
        >
          {isDisabled && <Check size={10} />}
          {b === 'MOTILAL' ? 'Motilal Oswal' : 'Shoonya'}
        </button>
      );
    })}

    {/* Custom broker chip */}
    <button
      type="button"
      className={[
        'acm__broker-chip',
        'acm__broker-chip--custom',
        value === 'CUSTOM' ? 'acm__broker-chip--active' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onChange('CUSTOM')}
      title="Add any other broker"
    >
      <Pencil size={10} />
      Custom
    </button>
  </div>
);

// ─── BrokerFieldsSection ──────────────────────────────────────────────────────
const BrokerFieldsSection: React.FC<{
  entry:           BrokerEntry;
  onFieldChange:   (id: string, key: string, val: string) => void;
  onTogglePwd:     (id: string, key: string) => void;
  onRemove?:       () => void;
  onToggleExpand:  (id: string) => void;
  onBrokerChange:  (id: string, b: BrokerKey) => void;
  onCustomName:    (id: string, name: string) => void;
  disabledBrokers: string[];
  showRemove:      boolean;
}> = ({
  entry, onFieldChange, onTogglePwd, onRemove,
  onToggleExpand, onBrokerChange, onCustomName,
  disabledBrokers, showRemove,
}) => {
  const fields = entry.broker ? getBrokerFields(entry.broker as BrokerKey) : [];

  return (
    <div className={`acm__broker-block${entry.expanded ? ' acm__broker-block--open' : ''}`}>
      {/* ── Header ── */}
      <div className="acm__broker-block-head">
        <button
          type="button"
          className="acm__broker-expand"
          onClick={() => onToggleExpand(entry.id)}
        >
          <ChevronDown
            size={14}
            className={`acm__chevron${entry.expanded ? ' acm__chevron--up' : ''}`}
          />
          <span>{brokerDisplayName(entry)}</span>
        </button>
        {showRemove && (
          <button type="button" className="acm__broker-remove" onClick={onRemove}>
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {entry.expanded && (
        <div className="acm__broker-body">
          {/* ── Chip row ── */}
          <BrokerSelect
            value={entry.broker as BrokerKey | ''}
            disabled={disabledBrokers}
            onChange={b => onBrokerChange(entry.id, b)}
          />

          {/* ── Custom broker name input ── */}
          {entry.broker === 'CUSTOM' && (
            <div className="acm__field acm__field--sm">
              <label className="acm__label">
                Broker Name <span className="acm__required"> *</span>
              </label>
              <p className="acm__hint">Enter the broker name (e.g. ZERODHA, ICICI, ANGEL)</p>
              <input
                className="acm__input acm__input--custom-name"
                type="text"
                placeholder="e.g. ZERODHA"
                value={entry.customName}
                onChange={e => onCustomName(entry.id, e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>
          )}

          {/* ── Broker credential fields ── */}
          {entry.broker && (
            <div className="acm__broker-fields">
              {fields.map(f => (
                <div key={f.key} className="acm__field acm__field--sm">
                  <label className="acm__label">
                    {f.label}
                    {f.required && <span className="acm__required"> *</span>}
                  </label>
                  {f.hint && <p className="acm__hint">{f.hint}</p>}
                  <div className="acm__input-wrap">
                    <input
                      className="acm__input"
                      type={f.type === 'password' && !entry.showPwd[f.key] ? 'password' : 'text'}
                      placeholder={f.placeholder}
                      value={entry.fields[f.key] ?? ''}
                      onChange={e => onFieldChange(entry.id, f.key, e.target.value)}
                      autoComplete="off"
                    />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        className="acm__eye"
                        onClick={() => onTogglePwd(entry.id, f.key)}
                        tabIndex={-1}
                      >
                        {entry.showPwd[f.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose }) => {
  const dispatch          = useAppDispatch();
  const { showToast }     = useToast();
  const { data: clients } = useAppSelector(s => s.clients);
  const clientList        = useMemo(() => Object.values(clients) as any[], [clients]);

  // Panel mode
  const [panelMode,       setPanelMode]       = useState<PanelMode>('new-client');
  const [selectedClient,  setSelectedClient]  = useState<any | null>(null);
  const [search,          setSearch]          = useState('');

  // New-client form
  const [form,        setForm]        = useState<ClientForm>(EMPTY_FORM);
  const [brokers,     setBrokers]     = useState<BrokerEntry[]>([emptyBroker()]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ClientForm, string>>>({});
  const [error,       setError]       = useState('');

  // Add-broker-to-existing form
  const [abBrokers, setAbBrokers] = useState<BrokerEntry[]>([emptyBroker()]);
  const [abError,   setAbError]   = useState('');

  const [loading, setLoading] = useState(false);

  // ── Filtered client list ──────────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    return clientList.filter(c =>
      c.client_code?.toLowerCase().includes(q) ||
      (c.client_name ?? c.name ?? '').toLowerCase().includes(q)
    );
  }, [clientList, search]);

  // ── Broker state helpers ──────────────────────────────────────────────────
  const makeBrokerOps = (setter: React.Dispatch<React.SetStateAction<BrokerEntry[]>>) => ({
    addBroker:    ()                              => setter(p => [...p, emptyBroker()]),
    removeBroker: (id: string)                   => setter(p => p.filter(b => b.id !== id)),
    fieldChange:  (id: string, key: string, val: string) =>
      setter(p => p.map(b => b.id === id ? { ...b, fields: { ...b.fields, [key]: val } } : b)),
    togglePwd:    (id: string, key: string)      =>
      setter(p => p.map(b => b.id === id ? { ...b, showPwd: { ...b.showPwd, [key]: !b.showPwd[key] } } : b)),
    toggleExpand: (id: string)                   =>
      setter(p => p.map(b => b.id === id ? { ...b, expanded: !b.expanded } : b)),
    brokerChange: (id: string, broker: BrokerKey) =>
      setter(p => p.map(b => b.id === id ? { ...b, broker, fields: {}, showPwd: {}, customName: '' } : b)),
    customName:   (id: string, name: string)     =>
      setter(p => p.map(b => b.id === id ? { ...b, customName: name } : b)),
  });

  const newClientOps = makeBrokerOps(setBrokers);
  const addBrokerOps = makeBrokerOps(setAbBrokers);

  const buildBrokersMap = (entries: BrokerEntry[]): Record<string, any> | null => {
  const map: Record<string, any> = {};
  for (const entry of entries) {
    if (!entry.broker) continue;
    if (entry.broker === 'CUSTOM' && !entry.customName.trim()) return null;
    const key    = resolvedBrokerKey(entry);
    const fields = getBrokerFields(entry.broker as BrokerKey);
    const creds: Record<string, any> = { enabled: true };
    fields.forEach(f => {
      const v = entry.fields[f.key]?.trim();
      if (v) {
        creds[f.key] = v;
        if (f.type === 'password') {
          creds['hashPassword'] = true;
        }
      }
    });
    map[key] = creds;
  }
  return map;
};
  const handleSubmitNewClient = async () => {
    const errors: Partial<Record<keyof ClientForm, string>> = {};
    if (!form.client_code.trim()) errors.client_code = 'Client Code is required';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    const activeBrokers = brokers.filter(b => b.broker);
    if (activeBrokers.length === 0) { setError('Please configure at least one broker'); return; }

    for (const entry of activeBrokers) {
      if (entry.broker === 'CUSTOM') {
        if (!entry.customName.trim()) { setError('Custom broker: Broker Name is required'); return; }
      } else {
        for (const f of getBrokerFields(entry.broker as BrokerKey)) {
          if (f.required && !entry.fields[f.key]?.trim()) {
            setError(`Broker ${entry.broker}: "${f.label}" is required`);
            return;
          }
        }
      }
    }

    setLoading(true); setError('');
    try {
      const clientCode  = form.client_code.trim().toUpperCase();
      const brokersMap  = buildBrokersMap(activeBrokers)!;

      await clientService.add({
        name:     form.name?.trim() || undefined,
        clientCode,
        email:    form.email.trim()  || undefined,
        phone:    form.phone ? Number(form.phone) : undefined,
        isActive: form.is_active,
        isMaster: form.is_master,
        brokers:  brokersMap,
      });

      dispatch(fetchClients());
      showToast(`Client ${clientCode} added successfully`, 'success');
      onClose();
    } catch (e: any) {
      const msg = e.message ?? 'Failed to add client';
      setError(msg);
      showToast(msg, 'error');
    } finally { setLoading(false); }
  };

  // ── Add broker to existing client ─────────────────────────────────────────
  const handleSubmitAddBroker = async () => {
    if (!selectedClient) return;

    for (const entry of abBrokers) {
      if (!entry.broker) { setAbError('Please select a broker'); return; }
      if (entry.broker === 'CUSTOM') {
        if (!entry.customName.trim()) { setAbError('Custom broker: Broker Name is required'); return; }
      } else {
        for (const f of getBrokerFields(entry.broker as BrokerKey)) {
          if (f.required && !entry.fields[f.key]?.trim()) {
            setAbError(`Broker ${entry.broker}: "${f.label}" is required`);
            return;
          }
        }
      }
    }

    setLoading(true); setAbError('');
    try {
      const brokersMap = buildBrokersMap(abBrokers)!;

      await dispatch(updateClient({
        clientCode: selectedClient.client_code,
        body: { brokers: brokersMap },
      }));

      dispatch(fetchClients());
      showToast(`Broker(s) added to ${selectedClient.client_code}`, 'success');
      setSelectedClient(null);
      setPanelMode('new-client');
      setAbBrokers([emptyBroker()]);
    } catch (e: any) {
      setAbError(e.message ?? 'Failed to add broker');
    } finally { setLoading(false); }
  };

  // ── Select client for add-broker flow ─────────────────────────────────────
  const handleSelectClient = (c: any) => {
    setSelectedClient(c);
    setPanelMode('add-broker');
    setAbBrokers([emptyBroker()]);
    setAbError('');
  };

  // ── Duplicate-broker guards ───────────────────────────────────────────────
  // Only lock known brokers; custom ones have free names
  const usedKnownInNew = brokers
    .filter(b => b.broker && b.broker !== 'CUSTOM')
    .map(b => b.broker as string);

  const usedKnownInAb = abBrokers
    .filter(b => b.broker && b.broker !== 'CUSTOM')
    .map(b => b.broker as string);

  const existingAb = selectedClient ? getEnabledBrokers(selectedClient) : [];

  // canAddMore — allow unlimited custom brokers; cap known brokers
  const canAddMoreNew = true;   // always show button; user decides
  const canAddMoreAb  = true;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="acm acm--wide">

        {/* ══════════ LEFT PANEL — Form ══════════ */}
        <div className="acm__left">

          {/* ── Tabs ── */}
          <div className="acm__tabs">
            <button
              className={`acm__tab${panelMode === 'new-client' ? ' acm__tab--active' : ''}`}
              onClick={() => { setPanelMode('new-client'); setSelectedClient(null); }}
            >New Client</button>
            <button
              className={`acm__tab${panelMode === 'add-broker' ? ' acm__tab--active' : ''}`}
              onClick={() => setPanelMode('add-broker')}
            >
              Add Broker
              {selectedClient && (
                <span className="acm__tab-badge">{selectedClient.client_code}</span>
              )}
            </button>
          </div>

          {/* ────── NEW CLIENT FORM ────── */}
          {panelMode === 'new-client' && (
            <>
              <div className="acm__header">
                <h3 className="acm__title">Add New Client</h3>
                <button className="acm__close" onClick={onClose}><X size={16} /></button>
              </div>

              <div className="acm__body">
                {/* Client info */}
                <div className="acm__section-label">Client Info</div>
                {CLIENT_TEXT_FIELDS.map(({ key, label, placeholder, hint }) => (
                  <div className="acm__field" key={key}>
                    <label className="acm__label">
                      {label}
                      {key === 'client_code' && <span className="acm__required"> *</span>}
                    </label>
                    {hint && <p className="acm__hint">{hint}</p>}
                    <div className="acm__input-wrap">
                      <input
                        className={`acm__input${fieldErrors[key] ? ' acm__input--error' : ''}`}
                        type="text"
                        placeholder={placeholder}
                        value={form[key] as string}
                        maxLength={key === 'phone' ? 10 : undefined}
                        onChange={e => {
                          const v = key === 'phone'
                            ? e.target.value.replace(/\D/g, '').slice(0, 10)
                            : e.target.value;
                          setForm(p => ({ ...p, [key]: v }));
                          setFieldErrors(p => ({ ...p, [key]: undefined }));
                        }}
                        autoComplete="off"
                      />
                    </div>
                    {fieldErrors[key] && <p className="acm__field-error">{fieldErrors[key]}</p>}
                  </div>
                ))}

                {/* Toggles */}
                <div className="acm__toggles">
                  {(['is_active', 'is_master'] as const).map(key => (
                    <label className="acm__toggle-row" key={key}>
                      <div className="acm__toggle-info">
                        <span className="acm__label">{key === 'is_active' ? 'Active' : 'Master Account'}</span>
                        <span className="acm__hint">{key === 'is_active' ? 'Client can login and trade' : 'Can manage other clients'}</span>
                      </div>
                      <button
                        type="button"
                        className={`acm__switch${form[key] ? ' acm__switch--on' : ''}`}
                        onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                      >
                        <span className="acm__switch-thumb" />
                      </button>
                    </label>
                  ))}
                </div>

                {/* Brokers */}
                <div className="acm__section-label acm__section-label--mt">
                  Broker Accounts
                  <span className="acm__section-hint">Add one or more brokers</span>
                </div>

                {brokers.map((entry, idx) => (
                  <BrokerFieldsSection
                    key={entry.id}
                    entry={entry}
                    onFieldChange={newClientOps.fieldChange}
                    onTogglePwd={newClientOps.togglePwd}
                    onRemove={() => newClientOps.removeBroker(entry.id)}
                    onToggleExpand={newClientOps.toggleExpand}
                    onBrokerChange={newClientOps.brokerChange}
                    onCustomName={newClientOps.customName}
                    disabledBrokers={usedKnownInNew.filter((_, i) => i !== idx)}
                    showRemove={brokers.length > 1}
                  />
                ))}

                {canAddMoreNew && (
                  <button className="acm__add-broker-btn" type="button" onClick={newClientOps.addBroker}>
                    <Plus size={13} /> Add Another Broker
                  </button>
                )}

                {error && <p className="acm__error">{error}</p>}
              </div>

              <div className="acm__footer">
                <button className="cm__btn cm__btn--outline" onClick={onClose} disabled={loading}>Cancel</button>
                <button className="cm__btn cm__btn--primary" onClick={handleSubmitNewClient} disabled={loading}>
                  {loading ? 'Adding…' : 'Add Client'}
                </button>
              </div>
            </>
          )}

          {/* ────── ADD BROKER FORM ────── */}
          {panelMode === 'add-broker' && (
            <>
              <div className="acm__header">
                <div>
                  <h3 className="acm__title">Add Broker</h3>
                  {selectedClient && (
                    <p className="acm__subtitle">
                      for <strong>{selectedClient.client_code}</strong>
                      {selectedClient.client_name && <> · {selectedClient.client_name}</>}
                    </p>
                  )}
                </div>
                <button className="acm__close" onClick={onClose}><X size={16} /></button>
              </div>

              {!selectedClient ? (
                <div className="acm__body acm__body--center">
                  <div className="acm__empty-state">
                    <User size={32} />
                    <p>Select a client from the list →</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="acm__body">
                    {existingAb.length > 0 && (
                      <div className="acm__existing-brokers">
                        <span className="acm__section-hint">Already configured:</span>
                        {existingAb.map(b => (
                          <span key={b} className={`acm__broker-tag acm__broker-tag--${b.toLowerCase()}`}>{b}</span>
                        ))}
                      </div>
                    )}

                    {abBrokers.map((entry, idx) => (
                      <BrokerFieldsSection
                        key={entry.id}
                        entry={entry}
                        onFieldChange={addBrokerOps.fieldChange}
                        onTogglePwd={addBrokerOps.togglePwd}
                        onRemove={() => addBrokerOps.removeBroker(entry.id)}
                        onToggleExpand={addBrokerOps.toggleExpand}
                        onBrokerChange={addBrokerOps.brokerChange}
                        onCustomName={addBrokerOps.customName}
                        disabledBrokers={[...existingAb, ...usedKnownInAb.filter((_, i) => i !== idx)]}
                        showRemove={abBrokers.length > 1}
                      />
                    ))}

                    {canAddMoreAb && (
                      <button className="acm__add-broker-btn" type="button" onClick={addBrokerOps.addBroker}>
                        <Plus size={13} /> Add Another Broker
                      </button>
                    )}

                    {abError && <p className="acm__error">{abError}</p>}
                  </div>

                  <div className="acm__footer">
                    <button className="cm__btn cm__btn--outline"
                      onClick={() => { setSelectedClient(null); setAbBrokers([emptyBroker()]); }}
                      disabled={loading}>
                      Clear
                    </button>
                    <button className="cm__btn cm__btn--primary" onClick={handleSubmitAddBroker} disabled={loading}>
                      {loading ? 'Saving…' : 'Save Broker(s)'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ══════════ RIGHT PANEL — Client List ══════════ */}
        <div className="acm__right">
          <div className="acm__right-head">
            <span className="acm__right-title">Existing Clients</span>
            <span className="acm__right-hint">Click to add broker</span>
          </div>

          <div className="acm__search-wrap">
            <Search size={13} className="acm__search-ico" />
            <input
              className="acm__search"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="acm__client-list">
            {filteredClients.length === 0 && (
              <div className="acm__list-empty">No clients found</div>
            )}
            {filteredClients.map(c => {
              const enabled  = getEnabledBrokers(c);
              const isActive = selectedClient?.client_code === c.client_code;
              const name     = c.client_name ?? c.name ?? '—';

              return (
                <button
                  key={c.client_code}
                  className={`acm__cl-row${isActive ? ' acm__cl-row--active' : ''}`}
                  onClick={() => handleSelectClient(c)}
                  title={`Add broker to ${c.client_code}`}
                >
                  <div className="acm__cl-avatar">{name[0]?.toUpperCase()}</div>
                  <div className="acm__cl-info">
                    <span className="acm__cl-code">{c.client_code}</span>
                    <span className="acm__cl-name">{name}</span>
                  </div>
                  <div className="acm__cl-badges">
                    {enabled.map(b => (
                      <span key={b} className={`acm__pip acm__pip--${b.toLowerCase()}`}>
                        {b.substring(0, 2)}
                      </span>
                    ))}
                    <span className="acm__pip acm__pip--add"><Plus size={9} /></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};