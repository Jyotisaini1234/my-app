import React from 'react';
import './FormGroup.scss';

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, children, error, hint }) => {
  return (
    <div className={`form-group ${error ? 'form-group--error' : ''}`}>
      <label>{label}</label>
      {children}
      {error && <span className="form-group__error">{error}</span>}
      {hint && !error && <span className="form-group__hint">{hint}</span>}
    </div>
  );
};