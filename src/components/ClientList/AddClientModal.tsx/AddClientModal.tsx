import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import './AddClientModal.scss';
import { useAppDispatch } from '../../../store/hooks';
import { fetchClients } from '../../../store/slice/clientsSlice/clientsSlice';
import { clientService } from '../../../services/api';
import { useToast } from '../../../context/Toastcontext';
import { ClientForm } from '../../../types/type';

interface AddClientModalProps {
  onClose: () => void;
}


const EMPTY_FORM: ClientForm = {
  client_code: '', user_id: '', password: '', api_key: '',
  authorization: '', totp_secret: '', totp_token: '', two_fa: '',
  email: '', phone: '', is_active: true, is_master: false,
};

const TEXT_FIELDS: {
  key: keyof Omit<ClientForm, 'is_active' | 'is_master'>;
  label: string; placeholder: string; sensitive?: boolean; hint?: string;
}[] = [
  { key: 'client_code',   label: 'Client Code',        placeholder: 'e.g. SOAR1210' },
  { key: 'user_id',       label: 'User ID',             placeholder: 'e.g. SOAR1210 (usually same as client code)', hint: 'Broker login user ID' },
  { key: 'password',      label: 'Password',            placeholder: 'e.g. Soar@1210',               sensitive: true },
  { key: 'api_key',       label: 'API Key',             placeholder: 'e.g. fEFNmRugttmNxU9j',        sensitive: true },
  { key: 'authorization', label: 'Authorization Token', placeholder: 'e.g. 5f83696de2d946d0be8073a46fec09d1_M', sensitive: true, hint: 'Token set after broker authentication' },
  { key: 'totp_secret',   label: 'TOTP Secret',         placeholder: 'e.g. XOZL72EXAH25H4JX…',      sensitive: true, hint: 'Base32 secret for authenticator app' },
  { key: 'totp_token',    label: 'TOTP Token',          placeholder: 'e.g. 814730',                  hint: '6-digit current OTP' },
  { key: 'two_fa',        label: '2FA / PAN',           placeholder: 'e.g. AKBPA8272D',              hint: 'PAN card or broker 2FA value' },
  { key: 'email',         label: 'Email',               placeholder: 'e.g. user@example.com' },
  { key: 'phone',         label: 'Phone',               placeholder: 'e.g. 9876543210',              hint: '10 digit mobile number' },
];

const REQUIRED_FIELDS: (keyof Omit<ClientForm, 'is_active' | 'is_master'>)[] = [
  'client_code', 'user_id', 'password', 'api_key',
  'authorization', 'totp_secret', 'totp_token', 'two_fa',
  'email', 'phone',
];

const FIELD_LABELS: Partial<Record<keyof ClientForm, string>> = {
  client_code:'Client Code',
  user_id:'User ID',
  password:'Password',
  api_key:'API Key',
  authorization:'Authorization Token',
  totp_secret:'TOTP Secret',
  totp_token:'TOTP Token',
  two_fa:'2FA / PAN',
  email:'Email',
  phone:'Phone',
};

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose }) => {
  const dispatch                      = useAppDispatch();
  const { showToast }                 = useToast();
  const [form, setForm]               = useState<ClientForm>(EMPTY_FORM);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ClientForm, string>>>({});
  const [showFields, setShowFields]   = useState<Set<keyof ClientForm>>(new Set());

  const set = (key: keyof ClientForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    setError('');
  };

  const handleClientCodeChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      client_code: value,
      user_id: prev.user_id === prev.client_code ? value : prev.user_id,
    }));
    setFieldErrors(prev => ({ ...prev, client_code: undefined }));
    setError('');
  };

  const handlePhoneChange = (value: string) => {
    set('phone', value.replace(/\D/g, '').slice(0, 10));
  };

  const toggleVisibility = (key: keyof ClientForm) =>
    setShowFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const validate = (): boolean => {
    const errors: Partial<Record<keyof ClientForm, string>> = {};

    REQUIRED_FIELDS.forEach(key => {
      const val = (form[key] as string).trim();
      if (!val) {
        errors[key] = `${FIELD_LABELS[key]} is required`;
      }
    });

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    if (form.totp_token.trim() && !/^\d{6}$/.test(form.totp_token.trim())) {
      errors.totp_token = 'TOTP Token must be exactly 6 digits';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorKey = REQUIRED_FIELDS.find(k => errors[k]);
      if (firstErrorKey) {
        const el = document.querySelector<HTMLInputElement>(`.acm__input[data-field="${firstErrorKey}"]`);
        el?.focus();
      }
      return false;
    }

    return true;
  };

  const parseFieldError = (msg: string): { field?: keyof ClientForm; message: string } => {
    const lower = msg.toLowerCase();
    if (lower.includes('email already'))                          return { field: 'email',       message: msg };
    if (lower.includes('phone') && lower.includes('already'))    return { field: 'phone',       message: msg };
    if (lower.includes('client already') || lower.includes('already exists')) return { field: 'client_code', message: msg };
    return { message: msg };
  };

  const handleSubmit = async () => {
    const isValid = validate();
    if (!isValid) return;

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const clientCode = form.client_code.trim().toUpperCase();

      await clientService.add({
        clientCode,
        userId:        form.user_id.trim(), 
        password:      form.password.trim(),
        apiKey:        form.api_key.trim(),
        totpSecret:    form.totp_secret.trim()   || undefined,
        totpToken:     form.totp_token.trim()    || undefined,
        twoFa:         form.two_fa.trim()        || undefined,
        active:        form.is_active,
        master:        form.is_master,
        email:         form.email.trim()         || undefined,
        phone:         form.phone ? Number(form.phone) : undefined,
        authorization: form.authorization.trim() || undefined,
      });

      dispatch(fetchClients());
      showToast(`Client ${clientCode} added successfully`, 'success');
      onClose();

    } catch (e: any) {
      const msg: string = e.message ?? 'Failed to add client';
      const { field, message } = parseFieldError(msg);

      if (field) {
        setFieldErrors({ [field]: message });
        const el = document.querySelector<HTMLInputElement>(`.acm__input[data-field="${field}"]`);
        el?.focus();
      } else {
        setError(message);
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="acm">
        <div className="acm__header">
          <h3 className="acm__title">Add New Client</h3>
          <button className="acm__close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="acm__body">
          {TEXT_FIELDS.map(({ key, label, placeholder, sensitive, hint }) => {
            const hasFieldError = !!fieldErrors[key];
            return (
              <div className="acm__field" key={key}>
                <label className="acm__label">
                  {label}
                  <span className="acm__required">*</span>
                </label>
                {hint && <p className="acm__hint">{hint}</p>}
                <div className="acm__input-wrap">
                  <input className={`acm__input${hasFieldError ? ' acm__input--error' : ''}`} data-field={key} type={sensitive && !showFields.has(key) ? 'password' : 'text'} placeholder={placeholder} value={form[key] as string} maxLength={key === 'phone' ? 10 : key === 'totp_token' ? 6 : undefined} onChange={e => { if (key === 'client_code') handleClientCodeChange(e.target.value);else if (key === 'phone')  handlePhoneChange(e.target.value); else set(key, e.target.value);}} autoComplete="off" />
                  {sensitive && (
                    <button type="button" className="acm__eye" onClick={() => toggleVisibility(key)} tabIndex={-1}>
                      {showFields.has(key) ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
                {hasFieldError && (
                  <p className="acm__field-error">{fieldErrors[key]}</p>
                )}
              </div>
            );
          })}

          {/* Toggles */}
          <div className="acm__toggles">
            {(['is_active', 'is_master'] as const).map(key => (
              <label className="acm__toggle-row" key={key}>
                <div className="acm__toggle-info">
                  <span className="acm__label">{key === 'is_active' ? 'Active' : 'Master Account'}</span>
                  <span className="acm__hint">{key === 'is_active' ? 'Client can login and trade' : 'Can manage other clients'}</span>
                </div>
                <button type="button"className={`acm__switch ${form[key] ? 'acm__switch--on' : ''}`} onClick={() => set(key, !form[key])} aria-pressed={form[key]} >
                  <span className="acm__switch-thumb" />
                </button>
              </label>
            ))}
          </div>

          {/* General error */}
          {error && <p className="acm__error">{error}</p>}
        </div>

        <div className="acm__footer">
          <button className="cm__btn cm__btn--outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="cm__btn cm__btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding…' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
};