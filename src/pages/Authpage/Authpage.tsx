import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAuthView, clearForgotState } from '../../store/slice/authSlice/authSlice';

import './AuthPage.scss';
import { ForgotPasswordPage } from '../Forgotpasswordpage/Forgotpasswordpage';
import { LoginPage } from '../Loginpage/Loginpage';
import { SignupPage } from '../Signuppage/Signuppage';
import { NexiomLogo } from '../../components/Icons/Authicons';

export const AuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, authView: view } = useAppSelector(s => s.auth);
  const switchTab = (tab: typeof view) => {
    if (tab === view) return;
    dispatch(setAuthView(tab));
  };

  const goToForgot = () => dispatch(setAuthView('forgot'));
  const goToLogin  = () => {
    dispatch(clearForgotState()); 
    dispatch(setAuthView('login'));
  };

  if (isAuthenticated) return null;

  return (
    <div className="auth-page">
      {/* BG effects */}
      <div className="auth-page__bg-grid" />
      <div className="auth-page__glow auth-page__glow--top-right" />
      <div className="auth-page__glow auth-page__glow--bottom-left" />

      {/* Card */}
      <div className="auth-card">

        {/* ── Header ── */}
        <div className="auth-card__header">
          <div className="auth-card__logo-row">
            <NexiomLogo />
            <div>
              <div className="auth-card__brand-name">Nexiom</div>
              <div className="auth-card__brand-sub">Trade Automation Platform</div>
            </div>
          </div>

          {/* Tabs — only for login / signup */}
          {view !== 'forgot' && (
            <div className="auth-card__tabs">
              <button
                className={`auth-card__tab${view === 'login' ? ' auth-card__tab--active' : ''}`}
                onClick={() => switchTab('login')}
                type="button"
              >
                Login
              </button>
              {/* <button
                className={`auth-card__tab${view === 'signup' ? ' auth-card__tab--active' : ''}`}
                onClick={() => switchTab('signup')}
                type="button"
              >
                Sign Up
              </button> */}
            </div>
          )}

          {/* Forgot header */}
          {view === 'forgot' && (
            <div style={{ paddingBottom: '1rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 500 }}>
                Account Recovery
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="auth-card__body">
          {view === 'login'  && <LoginPage onForgotPassword={goToForgot} />}
          {view === 'signup' && <SignupPage />}
          {view === 'forgot' && (
            <ForgotPasswordPage
              onBack={goToLogin}
              onSuccess={goToLogin}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthPage;