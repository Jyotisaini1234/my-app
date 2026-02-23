import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {sendSignupOtpThunk,verifySignupOtpThunk, resendOtpThunk, clearError, clearOtpState,} from '../../store/slice/authSlice/authSlice';
import { EyeIcon, LockIcon, MailIcon, MapIcon, PhoneIcon, ShieldIcon, SpinnerIcon, UserIcon } from '../../components/Icons/Authicons';

export const SignupPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, otpSent, pendingSignup } = useAppSelector(s => s.auth);
  const [name,setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city,  setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');

  const clearMessages = () => { setLocalError(''); setSuccessMsg(''); dispatch(clearError()); };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (password !== confirmPass) { setLocalError('Passwords do not match'); return; }
    if (password.length < 8)      { setLocalError('Password must be at least 8 characters'); return; }

    setLoadingMsg('Sending OTP...');

    const hint = setTimeout(() => setLoadingMsg('Sending OTP... (email server can take up to 15s)'), 5000);

    const result = await dispatch(sendSignupOtpThunk({ name, email, phone, city, password }));
    clearTimeout(hint);
    setLoadingMsg('');

    if (sendSignupOtpThunk.fulfilled.match(result)) {
      setSuccessMsg('OTP sent! Check your inbox (and spam folder).');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!pendingSignup) {
      setLocalError('Session expired. Please go back and try again.');
      return;
    }

    setLoadingMsg('Creating account...');
    await dispatch(verifySignupOtpThunk({
      name:     pendingSignup.name,
      email:    pendingSignup.email,
      phone:    pendingSignup.phone,
      city:     pendingSignup.city,
      password: pendingSignup.password,
      role:     'USER',
      otp,
    }));
    setLoadingMsg('');
  };

  const handleResend = async () => {
    clearMessages();
    setLoadingMsg('Resending...');
    const result = await dispatch(resendOtpThunk({
      email: pendingSignup?.email ?? email,
      purpose: 'signup',
    }));
    setLoadingMsg('');
    if (resendOtpThunk.fulfilled.match(result)) {
      setSuccessMsg('OTP resent! Check your inbox and spam folder.');
    }
  };

  const handleBack = () => {
    clearMessages();
    dispatch(clearOtpState());
    setOtp('');
    setLoadingMsg('');
  };

  const displayError = localError || error;

  if (otpSent) {
    return (
      <form className="auth-form" onSubmit={handleVerifyOtp}>
        <div>
          <div className="auth-form__title">Verify Email</div>
          <div className="auth-form__subtitle">
            OTP sent to <strong>{pendingSignup?.email}</strong>
          </div>
        </div>

        <div className="auth-toast" style={{ background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.3)', color: 'rgba(99,179,237,0.9)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem' }}>
           Check your inbox and <strong>spam/junk folder</strong>. OTP expires in 10 minutes.
        </div>

        {successMsg && (
          <div className="auth-toast auth-toast--success">
            <span className="auth-toast__icon">✓</span> {successMsg}
          </div>
        )}
        {displayError && (
          <div className="auth-toast auth-toast--error">
            <span className="auth-toast__icon">⚠</span> {displayError}
          </div>
        )}

        <div className="auth-input">
          <label className="auth-input__label">
            Enter OTP <span className="auth-input__req">*</span>
          </label>
          <div className="auth-input__wrap">
            <span className="auth-input__icon"><ShieldIcon /></span>
            <input className="auth-input__field auth-input__field--has-icon" type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} inputMode="numeric" autoComplete="one-time-code" autoFocus />
          </div>
        </div>

        <button type="submit" className="auth-btn auth-btn--primary" disabled={loading || otp.length < 4}>
          {loading && <SpinnerIcon />}
          {loading ? (loadingMsg || 'Creating Account...') : 'Create Account'}
        </button>

        <button type="button" className="auth-btn auth-btn--secondary" onClick={handleResend} disabled={loading}>
          {loading ? (loadingMsg || 'Please wait...') : 'Resend OTP'}
        </button>

        <button type="button" className="auth-btn auth-btn--ghost" onClick={handleBack} disabled={loading}>
          ← Back to form
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSendOtp}>
      <div>
        <div className="auth-form__title">Create Account</div>
        <div className="auth-form__subtitle">Start automating your trades today</div>
      </div>

      {successMsg && (
        <div className="auth-toast auth-toast--success">
          <span className="auth-toast__icon">✓</span> {successMsg}
        </div>
      )}
      {displayError && (
        <div className="auth-toast auth-toast--error">
          <span className="auth-toast__icon">⚠</span> {displayError}
        </div>
      )}

      <div className="auth-form__row-2">
        <div className="auth-input">
          <label className="auth-input__label">Full Name <span className="auth-input__req">*</span></label>
          <div className="auth-input__wrap">
            <span className="auth-input__icon"><UserIcon /></span>
            <input className="auth-input__field auth-input__field--has-icon" type="text" placeholder="John Doe"
              value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
          </div>
        </div>

        <div className="auth-input">
          <label className="auth-input__label">Phone <span className="auth-input__req">*</span></label>
          <div className="auth-input__wrap">
            <span className="auth-input__icon"><PhoneIcon /></span>
            <input className="auth-input__field auth-input__field--has-icon" type="tel" placeholder="9999999999"
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required autoComplete="tel" inputMode="numeric" />
          </div>
        </div>
      </div>

      <div className="auth-input">
        <label className="auth-input__label">Email <span className="auth-input__req">*</span></label>
        <div className="auth-input__wrap">
          <span className="auth-input__icon"><MailIcon /></span>
          <input className="auth-input__field auth-input__field--has-icon" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
      </div>

      <div className="auth-input">
        <label className="auth-input__label">City</label>
        <div className="auth-input__wrap">
          <span className="auth-input__icon"><MapIcon /></span>
          <input className="auth-input__field auth-input__field--has-icon" type="text" placeholder="Mumbai"
            value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
        </div>
      </div>

      <div className="auth-input">
        <label className="auth-input__label">Password <span className="auth-input__req">*</span></label>
        <div className="auth-input__wrap">
          <span className="auth-input__icon"><LockIcon /></span>
          <input className="auth-input__field auth-input__field--has-icon auth-input__field--has-right"
            type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
            value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          <span className="auth-input__right">
            <button type="button" className="auth-input__eye-btn" onClick={() => setShowPass(!showPass)}>
              <EyeIcon open={showPass} />
            </button>
          </span>
        </div>
      </div>

      <div className="auth-input">
        <label className="auth-input__label">Confirm Password <span className="auth-input__req">*</span></label>
        <div className="auth-input__wrap">
          <span className="auth-input__icon"><LockIcon /></span>
          <input className="auth-input__field auth-input__field--has-icon auth-input__field--has-right"
            type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
            value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required autoComplete="new-password" />
          <span className="auth-input__right">
            <button type="button" className="auth-input__eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
              <EyeIcon open={showConfirm} />
            </button>
          </span>
        </div>
      </div>

      <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
        {loading && <SpinnerIcon />}
        {loading ? (loadingMsg || 'Sending OTP...') : 'Send OTP & Continue →'}
      </button>
    </form>
  );
};