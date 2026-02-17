import React, { useState } from 'react';
import './AddClientModal.scss';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addClient } from '../../../store/slice/clientsSlice/clientsSlice';
import { Modal } from '../../common/Modal/Modal';
import { Button } from '../../common/Button/Button';
import { FormGroup } from '../../common/FormGroup/FormGroup';

interface AddClientModalProps {
  onClose: () => void;
}

interface FormData {
  clientCode: string;
  userId: string;
  password: string;
  apiKey: string;
  totpSecret: string;
  twoFa: string;
  active: boolean;
  master: boolean;
}

const initialForm: FormData = {
  clientCode: '',
  userId: '',
  password: '',
  apiKey: '',
  totpSecret: '',
  twoFa: 'Y',
  active: true,
  master: false,
};

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.clients);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.clientCode.trim()) e.clientCode = 'Client code is required';
    if (!form.userId.trim()) e.userId = 'User ID is required';
    if (!form.password.trim()) e.password = 'Password is required';
    if (!form.apiKey.trim()) e.apiKey = 'API key is required';
    setErrors(e as Partial<FormData>);
    return Object.keys(e).length === 0;
  };

  const handleChange = (key: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await dispatch(addClient(form));
    onClose();
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" loading={loading} onClick={handleSubmit}>
        Add Client
      </Button>
    </>
  );

  return (
    <Modal title="Add New Client" onClose={onClose} footer={footer}>
      <div className="add-client-form">
        {error && <div className="add-client-form__error">{error}</div>}

        <div className="form-row">
          <FormGroup label="Client Code *" error={errors.clientCode as string}>
            <input
              value={form.clientCode}
              onChange={(e) => handleChange('clientCode', e.target.value.toUpperCase())}
              placeholder="SOAR1234"
            />
          </FormGroup>
          <FormGroup label="User ID *" error={errors.userId as string}>
            <input
              value={form.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              placeholder="user@broker"
            />
          </FormGroup>
        </div>

        <div className="form-row">
          <FormGroup label="Password *" error={errors.password as string}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="••••••••"
            />
          </FormGroup>
          <FormGroup label="API Key *" error={errors.apiKey as string}>
            <input
              value={form.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="API Key from broker"
            />
          </FormGroup>
        </div>

        <div className="form-row">
          <FormGroup label="TOTP Secret" hint="Optional – for 2FA auto-login">
            <input
              value={form.totpSecret}
              onChange={(e) => handleChange('totpSecret', e.target.value)}
              placeholder="Base32 secret"
            />
          </FormGroup>
          <FormGroup label="2FA PIN" hint="Static 2FA PIN if no TOTP">
            <input
              value={form.twoFa}
              onChange={(e) => handleChange('twoFa', e.target.value)}
              placeholder="Y or 6-digit PIN"
            />
          </FormGroup>
        </div>

        <div className="add-client-form__flags">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => handleChange('active', e.target.checked)}
            />
            <span>Active</span>
          </label>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={form.master}
              onChange={(e) => handleChange('master', e.target.checked)}
            />
            <span>Master Client</span>
          </label>
        </div>
      </div>
    </Modal>
  );
};