import React, { useState } from 'react';
import { api } from '../../../services/api';
// import { Button } from '../../common/Button/Button';

import { FormGroup } from '../../common/FormGroup/FormGroup';
import { Modal } from '../../common/Modal/Modal';
import { Button } from '@mui/material';


interface AddClientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({clientCode: '',userId: '', password: '', apiKey: '',totpSecret: '', twoFa: 'Y', active: true, master: false});

  const handleSubmit = async () => {
    try {
      await api.addClient(formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to add client: ' + err);
    }
  };

  return (
    <Modal title="Add New Client" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormGroup label="Client Code *">
          <input  value={formData.clientCode} onChange={e => setFormData({...formData, clientCode: e.target.value})}  placeholder="SOAR1234" />
        </FormGroup>
        
        <FormGroup label="User ID *">
          <input  value={formData.userId}  onChange={e => setFormData({...formData, userId: e.target.value})} />
        </FormGroup>
        
        <FormGroup label="Password *">
          <input type="password"  value={formData.password}   onChange={e => setFormData({...formData, password: e.target.value})} />
        </FormGroup>
        
        <FormGroup label="API Key *">
          <input  value={formData.apiKey}  onChange={e => setFormData({...formData, apiKey: e.target.value})}  />
        </FormGroup>
        
        <FormGroup label="TOTP Secret">
          <input value={formData.totpSecret} onChange={e => setFormData({...formData, totpSecret: e.target.value})}  />
        </FormGroup>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
          <input  type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})}  style={{ width: '18px', height: '18px' }}/>Active
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
          <input  type="checkbox" checked={formData.master}  onChange={e => setFormData({...formData, master: e.target.checked})} style={{ width: '18px', height: '18px' }}/>
          Master Client
        </label>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button onClick={onClose} variant="contained" color="secondary">Cancel</Button>
          <Button onClick={handleSubmit} style={{ flex: 1 }}>Add Client</Button>
        </div>
      </div>
    </Modal>
  );
};