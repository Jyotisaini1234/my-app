import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {sendForgotOtpThunk, verifyForgotOtpThunk, resetPasswordThunk,resendOtpThunk,setForgotEmail, setForgotStep, clearForgotState, clearError,} from '../../store/slice/authSlice/authSlice';
import { MailIcon, LockIcon, ShieldIcon, EyeIcon, CheckIcon, SpinnerIcon } from '../../components/Icons/Authicons';

interface ForgotPasswordPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack, onSuccess }) => {
  const dispatch = useAppDispatch();
  const { loading, error, resetToken, forgotEmail, forgotStep } = useAppSelector(s => s.auth);
  const step = forgotStep ?? 1;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError,  setLocalError]  = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  const clearMessages = () => { setLocalError(''); setSuccessMsg(''); dispatch(clearError()); };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    dispatch(setForgotEmail(email));
    const result = await dispatch(sendForgotOtpThunk(email));
    if (sendForgotOtpThunk.fulfilled.match(result)) {
      setSuccessMsg('OTP sent to your email!');
      dispatch(setForgotStep(2)); 
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const result = await dispatch(verifyForgotOtpThunk({
      identifier: forgotEmail || email,
      otp,
    }));
    if (verifyForgotOtpThunk.fulfilled.match(result)) {
      setSuccessMsg('OTP verified successfully!');
      dispatch(setForgotStep(3)); 
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (newPass !== confirmPass) { setLocalError('Passwords do not match'); return; }
    if (newPass.length < 8)     { setLocalError('Password must be at least 8 characters'); return; }

    const result = await dispatch(resetPasswordThunk({
      email: forgotEmail || email,
      resetToken: resetToken || '',
      newPassword: newPass,
    }));
    if (resetPasswordThunk.fulfilled.match(result)) {
      dispatch(clearForgotState()); 
      setSuccessMsg('Password reset successful!');
      setTimeout(() => onSuccess(), 1200);
    }
  };

  const handleResend = async () => {
    clearMessages();
    const result = await dispatch(resendOtpThunk({ email: forgotEmail || email, purpose: 'forgot-password' }));
    if (resendOtpThunk.fulfilled.match(result)) setSuccessMsg('OTP resent!');
  };

  const handleBack = () => {
    dispatch(clearForgotState()); 
    onBack();
  };

  const displayError = localError || error;
  const stepLabels   = ['Email', 'OTP', 'Reset'];

  return (
    <div className="auth-form">

      <button type="button" className="auth-btn auth-btn--ghost" onClick={handleBack}>
        ← Back to Login
      </button>

      <div>
        <div className="auth-steps">
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`auth-steps__dot ${step > s ? 'auth-steps__dot--done' : step === s ? 'auth-steps__dot--active' : ''}`}>
                {step > s ? <CheckIcon /> : s}
              </div>
              {i < 2 && (
                <div className={`auth-steps__line ${step > s + 1 ? 'auth-steps__line--done' : step > s ? 'auth-steps__line--active' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="auth-steps__labels">
          {stepLabels.map((label, i) => (
            <span key={label} className={step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}>
              {label}
            </span>
          ))}
        </div>
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

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div style={{ marginBottom: '1rem' }}>
            <div className="auth-form__title">Forgot Password?</div>
            <div className="auth-form__subtitle">Enter your registered email to receive OTP</div>
          </div>
          <div className="auth-input">
            <label className="auth-input__label">Email Address <span className="auth-input__req">*</span></label>
            <div className="auth-input__wrap">
              <span className="auth-input__icon"><MailIcon /></span>
              <input
                className="auth-input__field auth-input__field--has-icon"
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" autoFocus
              />
            </div>
          </div>
          <button type="submit" className="auth-btn auth-btn--primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading && <SpinnerIcon />}
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <div style={{ marginBottom: '1rem' }}>
            <div className="auth-form__title">Enter OTP</div>
            <div className="auth-form__subtitle">OTP sent to <strong>{forgotEmail || email}</strong></div>
          </div>
          <div className="auth-input">
            <label className="auth-input__label">OTP <span className="auth-input__req">*</span></label>
            <div className="auth-input__wrap">
              <span className="auth-input__icon"><ShieldIcon /></span>
              <input
                className="auth-input__field auth-input__field--has-icon"
                type="text" placeholder="6-digit OTP"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required maxLength={6} inputMode="numeric" autoComplete="one-time-code" autoFocus
              />
            </div>
          </div>
          <button type="submit" className="auth-btn auth-btn--primary" disabled={loading || otp.length < 4} style={{ marginTop: '0.5rem' }}>
            {loading && <SpinnerIcon />}
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" className="auth-btn auth-btn--secondary" onClick={handleResend} disabled={loading}>
            Resend OTP
          </button>
          <button type="button" className="auth-btn auth-btn--ghost" onClick={() => { dispatch(setForgotStep(1)); clearMessages(); setOtp(''); }}>
            ← Change email
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '1rem' }}>
            <div className="auth-form__title">Set New Password</div>
            <div className="auth-form__subtitle">Choose a strong new password</div>
          </div>
          <div className="auth-input">
            <label className="auth-input__label">New Password <span className="auth-input__req">*</span></label>
            <div className="auth-input__wrap">
              <span className="auth-input__icon"><LockIcon /></span>
              <input
                className="auth-input__field auth-input__field--has-icon auth-input__field--has-right"
                type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                value={newPass} onChange={e => setNewPass(e.target.value)}
                required autoComplete="new-password"
              />
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
              <input
                className="auth-input__field auth-input__field--has-icon auth-input__field--has-right"
                type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                required autoComplete="new-password"
              />
              <span className="auth-input__right">
                <button type="button" className="auth-input__eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  <EyeIcon open={showConfirm} />
                </button>
              </span>
            </div>
          </div>
          <button type="submit" className="auth-btn auth-btn--primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading && <SpinnerIcon />}
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};