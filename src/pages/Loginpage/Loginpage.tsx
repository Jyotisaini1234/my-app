import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginThunk, clearError } from '../../store/slice/authSlice/authSlice';
import { SpinnerIcon ,MailIcon, LockIcon, EyeIcon} from '../../components/Icons/Authicons';

interface LoginPageProps {
  onForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onForgotPassword }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(s => s.auth);
  const [identifierError, setIdentifierError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);

  const validateIdentifier = (value: string): string => {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    if (trimmed.length > 10) return 'Phone number cannot exceed 10 digits';
    return '';
  }
  
  if (trimmed.includes('@')) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|rediffmail|icloud|protonmail|ymail)\.(com|in|co\.in|net|org)$/i;
    if (!emailRegex.test(trimmed)) return 'Please enter valid email (e.g. user@gmail.com)';
    return '';
  }

  return '';
};
const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value;
  if (/^\d+$/.test(value)) {
    value = value.slice(0, 10);
  }
  
  setIdentifier(value);
  setIdentifierError(validateIdentifier(value));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const err = validateIdentifier(identifier);
  if (err) { setIdentifierError(err); return; }
  
  dispatch(clearError());
  dispatch(loginThunk({ identifier, password }));
};
  

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <div className="auth-form__title">Welcome back</div>
        <div className="auth-form__subtitle">Sign in to your trading account</div>
      </div>

      {/* Email / Phone */}
      <div className="auth-input">
        <label className="auth-input__label">
          Email / Phone <span className="auth-input__req">*</span>
        </label>
        <div className="auth-input__wrap">
          <span className="auth-input__icon"><MailIcon /></span>
        <input className={`auth-input__field auth-input__field--has-icon${identifierError ? ' auth-input__field--error' : ''}`} type="text" placeholder="Enter email or phone" value={identifier}onChange={handleIdentifierChange}  required autoComplete="username"/>
        </div>
      </div>

      {/* Password */}
      <div className="auth-input">
        <label className="auth-input__label">
          Password <span className="auth-input__req">*</span>
        </label>
        <div className="auth-input__wrap">
          <span className="auth-input__icon"><LockIcon /></span>
          <input className="auth-input__field auth-input__field--has-icon auth-input__field--has-right" type={showPass ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}required  autoComplete="current-password" />
          <span className="auth-input__right">
            <button type="button" className="auth-input__eye-btn" onClick={() => setShowPass(!showPass)}>
              <EyeIcon open={showPass} />
            </button>
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="auth-toast auth-toast--error">
          <span className="auth-toast__icon">⚠</span> {error}
        </div>
      )}
      {identifierError && (
        <p className="auth-input__error">⚠ {identifierError}</p>
      )}
      {/* Forgot Link */}
      <button type="button" className="auth-btn auth-btn--link" onClick={onForgotPassword}>
        Forgot password?
      </button>

      {/* Submit */}
      <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
        {loading && <SpinnerIcon />}
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="auth-form__divider">
        Secure trading powered by Nexiom &bull; Motilal API
      </div>
    </form>
  );
};