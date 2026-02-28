import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import './AddClientModal.scss';
import { useAppDispatch } from '../../../store/hooks';
import { fetchClients } from '../../../store/slice/clientsSlice/clientsSlice';
import { BROKER_BASE } from '../../../utils/ApiConstants';

interface AddClientModalProps {
  onClose: () => void;
}

interface ClientForm {
  client_code:   string;
  user_id:       string;
  password:      string;
  api_key:       string;
  authorization: string;
  totp_secret:   string;
  totp_token:    string;
  two_fa:        string;
  email:         string;
  phone:         string;
  is_active:     boolean;
  is_master:     boolean;
}

const EMPTY_FORM: ClientForm = {
  client_code:   '',
  user_id:       '',
  password:      '',
  api_key:       '',
  authorization: '',
  totp_secret:   '',
  totp_token:    '',
  two_fa:        '',
  email:         '',
  phone:         '',
  is_active:     true,
  is_master:     false,
};

const TEXT_FIELDS: {
  key: keyof Omit<ClientForm, 'is_active' | 'is_master'>;
  label: string;
  placeholder: string;
  required?: boolean;
  sensitive?: boolean;
  hint?: string;
}[] = [
  {
    key:         'client_code',
    label:       'Client Code',
    placeholder: 'e.g. SOAR1210',
    required:    true,
  },
  {
    key:         'user_id',
    label:       'User ID',
    placeholder: 'e.g. SOAR1210  (usually same as client code)',
    required:    true,
    hint:        'Broker login user ID',
  },
  {
    key:         'password',
    label:       'Password',
    placeholder: 'e.g. Soar@1210',
    required:    true,
    sensitive:   true,
  },
  {
    key:         'api_key',
    label:       'API Key',
    placeholder: 'e.g. fEFNmRugttmNxU9j',
    required:    true,
    sensitive:   true,
  },
  {
    key:         'authorization',
    label:       'Authorization Token',
    placeholder: 'e.g. 5f83696de2d946d0be8073a46fec09d1_M',
    sensitive:   true,
    hint:        'Optional — can be set later after authentication',
  },
  {
    key:         'totp_secret',
    label:       'TOTP Secret',
    placeholder: 'e.g. XOZL72EXAH25H4JX…',
    sensitive:   true,
    hint:        'Base32 secret for authenticator app (optional)',
  },
  {
    key:         'totp_token',
    label:       'TOTP Token',
    placeholder: 'e.g. 814730',
    hint:        '6-digit current OTP (optional)',
  },
  {
    key:         'two_fa',
    label:       '2FA / PAN',
    placeholder: 'e.g. AKBPA8272D',
    hint:        'PAN card or broker 2FA value (optional)',
  },
  {
    key:         'email',
    label:       'Email',
    placeholder: 'e.g. user@example.com',
    hint:        'Optional — for login via email',
  },
  {
    key:         'phone',
    label:       'Phone',
    placeholder: 'e.g. 9876543210',
    hint:        'Optional — 10 digit mobile number',
  },
];

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose }) => {
  const dispatch              = useAppDispatch();
  const [form, setForm]       = useState<ClientForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showFields, setShowFields] = useState<Set<keyof ClientForm>>(new Set());

  const set = (key: keyof ClientForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleClientCodeChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      client_code: value,
      user_id: prev.user_id === prev.client_code ? value : prev.user_id,
    }));
    setError('');
  };

  const toggleVisibility = (key: keyof ClientForm) =>
    setShowFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const validate = (): string => {
    if (!form.client_code.trim()) return 'Client Code is required';
    if (!form.user_id.trim())     return 'User ID is required';
    if (!form.password.trim())    return 'Password is required';
    if (!form.api_key.trim())     return 'API Key is required';
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) return 'Phone must be 10 digits';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
     const payload: Record<string, any> = {
  clientCode: form.client_code.trim().toUpperCase(),
  userId:     form.user_id.trim(),
  password:   form.password.trim(),
  apiKey:     form.api_key.trim(),
  isActive:   form.is_active,
  isMaster:   form.is_master,
};

if (form.authorization.trim()) payload['authorization'] = form.authorization.trim();
if (form.totp_secret.trim())   payload['totpSecret']    = form.totp_secret.trim();  
if (form.totp_token.trim())    payload['totpToken']     = form.totp_token.trim();     
if (form.two_fa.trim())        payload['twoFa']         = form.two_fa.trim();       
if (form.email.trim())         payload['email']         = form.email.trim();
if (form.phone.trim())         payload['phone']         = Number(form.phone.trim());

      const res = await fetch(`${BROKER_BASE}/api/client/add`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || body?.status === 'ERROR') {
        throw new Error(body?.message ?? `Error ${res.status}`);
      }

      dispatch(fetchClients());
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="acm">
        {/* Header */}
        <div className="acm__header">
          <h3 className="acm__title">Add New Client</h3>
          <button className="acm__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="acm__body">
          {TEXT_FIELDS.map(({ key, label, placeholder, required, sensitive, hint }) => {
            const isVisible = showFields.has(key);
            const inputType = sensitive && !isVisible ? 'password' : 'text';

            return (
              <div className="acm__field" key={key}>
                <label className="acm__label">
                  {label}
                  {required && <span className="acm__required">*</span>}
                </label>
                {hint && <p className="acm__hint">{hint}</p>}
                <div className="acm__input-wrap">
                  <input
                    className="acm__input"
                    type={inputType}
                    placeholder={placeholder}
                    value={form[key] as string}
                    onChange={e => {
                      if (key === 'client_code') handleClientCodeChange(e.target.value);
                      else { set(key, e.target.value); setError(''); }
                    }}
                    autoComplete="off"
                  />
                  {sensitive && (
                    <button
                      type="button"
                      className="acm__eye"
                      onClick={() => toggleVisibility(key)}
                      tabIndex={-1}
                    >
                      {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Toggle switches */}
          <div className="acm__toggles">
            <label className="acm__toggle-row">
              <div className="acm__toggle-info">
                <span className="acm__label">Active</span>
                <span className="acm__hint">Client can login and trade</span>
              </div>
              <button
                type="button"
                className={`acm__switch ${form.is_active ? 'acm__switch--on' : ''}`}
                onClick={() => set('is_active', !form.is_active)}
                aria-pressed={form.is_active}
              >
                <span className="acm__switch-thumb" />
              </button>
            </label>

            <label className="acm__toggle-row">
              <div className="acm__toggle-info">
                <span className="acm__label">Master Account</span>
                <span className="acm__hint">Can manage other clients</span>
              </div>
              <button
                type="button"
                className={`acm__switch ${form.is_master ? 'acm__switch--on' : ''}`}
                onClick={() => set('is_master', !form.is_master)}
                aria-pressed={form.is_master}
              >
                <span className="acm__switch-thumb" />
              </button>
            </label>
          </div>

          {error && <p className="acm__error">{error}</p>}
        </div>

        {/* Footer */}
        <div className="acm__footer">
          <button className="cm__btn cm__btn--outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="cm__btn cm__btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding…' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
};