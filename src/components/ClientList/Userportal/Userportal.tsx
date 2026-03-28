import React, { useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TagIcon from '@mui/icons-material/Tag';
import LayersIcon from '@mui/icons-material/Layers';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BadgeIcon from '@mui/icons-material/Badge';
import CakeIcon from '@mui/icons-material/Cake';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import './Userportal.scss';
import { NavPage, Client } from '../../../types/type';
import { HoldingsDrawer } from '../../common/HoldingsDrawer/HoldingsDrawer';
import { BankDetail, BrokerEntry, DpAccount, ShoonyaProfile, UserInfo } from '../../../types/profile';


const fmt = (v: number | null | undefined, fallback = '—') => {
  if (v == null) return fallback;
  const abs = Math.abs(v);
  const str = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${v < 0 ? '−' : ''}₹${str}`;
};

const fmtPct = (v: number | null | undefined) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const maskPan = (pan?: string) =>
  pan ? `${'•'.repeat(pan.length - 4)}${pan.slice(-4)}` : '—';

const maskAcct = (num?: string) =>
  num ? `${'•'.repeat(Math.max(0, num.length - 4))}${num.slice(-4)}` : '—';


interface UserPortalProps {
  client?:    Client;
  user?:      UserInfo;
  loading?:   boolean;
  onNavigate: (page: NavPage) => void;
  onRefresh?: () => void;
}


const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?:  boolean;
  tag?:   { text: string; color: 'green' | 'blue' | 'warn' };
}> = ({ label, value, mono, tag }) => (

  <div className="up__detail-row">
    <span className="up__detail-lbl">{label}</span>
    <span className={`up__detail-val${mono ? ' up__detail-val--mono' : ''}`}>
      {value || '—'}
    </span>
    {tag && (
      <span className={`up__detail-tag up__detail-tag--${tag.color}`}>
        {tag.text}
      </span>
    )}
  </div>
);

const SectionHead: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="up__sec-head">
    <span className="up__sec-head-icon">{icon}</span>
    <span className="up__sec-head-title">{title}</span>
  </div>
);

const BrokerPill: React.FC<{ auth: boolean }> = ({ auth }) => (
  <span className={`up__broker-pill up__broker-pill--${auth ? 'ok' : 'warn'}`}>
    <FiberManualRecordIcon style={{ fontSize: '0.4rem' }} />
    {auth ? 'Authenticated' : 'Pending'}
  </span>
);

const BalBox: React.FC<{ label: string; value: string; neg?: boolean }> = ({ label, value, neg }) => (
  <div className="up__bal-box">
    <span className="up__bal-lbl">{label}</span>
    <strong className={`up__bal-val${neg ? ' up__bal-val--neg' : ''}`}>{value}</strong>
  </div>
);


export const UserPortal: React.FC<UserPortalProps> = ({ client, user, loading = false, onNavigate, onRefresh,}) => {
  let [showHoldings, setShowHoldings] = useState(false);
  let brokersMap = ((client as any)?.brokers ?? {}) as Record<string, BrokerEntry>;
  let motilal = brokersMap['MOTILAL'] as BrokerEntry | undefined;
  let shoonya = brokersMap['SHOONYA'] as BrokerEntry | undefined;
  let hasBoth = !!motilal && !!shoonya;
  let sh = ((client as any)?.shoonya_profile ?? null) as ShoonyaProfile | null;
  let shoonyaOk = sh?.stat === 'Ok';
  let shoonyaError = !shoonyaOk ? (sh?.emsg || sh?.message || null) : null;
  let c = client as any;
  let moAvail = c?.available_cash ?? null;
  let moUsed = c?.used_margin ?? null;
  let moLedger = c?.ledger_balance ?? null;
  let moCollat = c?.collateral_value ?? null;
  let moInvested = c?.invested_amount ?? null;
  let moCurrent = c?.current_value ?? null;
  let moPnl = c?.profit_loss ?? null;
  let moPnlPct = c?.profit_loss_pct ?? null;
  let moHoldings = c?.total_holdings ?? 0;
  const isProfit = (moPnl ?? 0) >= 0;
  let shName = sh?.client_name?.trim() || sh?.user_name?.trim() || '';
  let moName = c?.name || c?.client_name || '';
  let displayName = (shoonyaOk && shName) ? shName : moName || user?.name || user?.clientCode || 'User';
  let isActive = c?.is_active;
  const clientCode = c?.client_code ?? user?.clientCode ?? '—';
  let moEmail = c?.email || '—';
  let shEmail = sh?.email || '—';
  let emailSame = moEmail !== '—' && moEmail === shEmail;
  let moPhone = c?.phone ? String(c.phone) : '—';
  let shPhone = sh?.mobile || '—';
  let phoneSame = moPhone !== '—' && moPhone === shPhone;
  const bankDetails = (sh?.bank_details ?? []) as BankDetail[];
  const dpAccounts = (sh?.dp_account ?? []) as DpAccount[];
  const isEnrichedLoading = loading || (client != null && moInvested == null && moAvail == null);

  return (
    <>
      <div className="up">
        <div className="up__hero">
          <div className="up__hero-top">
            <span className="up__badge">
              <FiberManualRecordIcon className="up__badge-dot" />
              Client portal
            </span>
            <span className={`up__chip up__chip--${isActive ? 'on' : 'off'}`}>
              {isActive ? <VerifiedUserIcon /> : <ErrorOutlineIcon />}
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="up__identity">
            <div className="up__avatar">{displayName[0]?.toUpperCase() ?? 'U'}</div>
            <div>
              <h2 className="up__name">{displayName}</h2>
              <span className="up__code">{clientCode}</span>
              {hasBoth && (
                <span className="up__broker-count">
                  <SwapHorizIcon style={{ fontSize: '0.75rem' }} />
                  2 broker accounts · Motilal &amp; Shoonya
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isEnrichedLoading && (
          <div className="up__loading-strip">
            <RefreshIcon className="spin" />
            <span>Loading portfolio &amp; balance…</span>
          </div>
        )}

        {!isEnrichedLoading && (motilal || shoonya) && (
          <div className={`up__brokers-grid${hasBoth ? '' : ' up__brokers-grid--single'}`}>

            {/* ── MOTILAL card ── */}
            {motilal && (
              <div className="up__broker-card up__broker-card--motilal">
                <div className="up__bc-head">
                  <div className="up__bc-logo up__bc-logo--motilal">MO</div>
                  <div className="up__bc-title">
                    <span className="up__bc-name">Motilal Oswal</span>
                    <span className="up__bc-uid">{motilal.user_id ?? '—'}</span>
                  </div>
                  <BrokerPill auth={motilal.is_authenticated} />
                </div>

                {/* Balances */}
                <div className="up__bal-grid">
                  <BalBox label="Available cash"  value={fmt(moAvail)}  neg={(moAvail ?? 0) < 0} />
                  <BalBox label="Used margin"     value={fmt(moUsed)} />
                  <BalBox label="Ledger balance"  value={fmt(moLedger)} neg={(moLedger ?? 0) < 0} />
                  <BalBox label="Collateral"      value={fmt(moCollat)} />
                </div>

                {/* P&L */}
                {moPnl != null && (
                  <div className={`up__pnl-banner up__pnl-banner--${isProfit ? 'profit' : 'loss'}`}>
                    <div className="up__pnl-left">
                      {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      <div>
                        <span className="up__pnl-lbl">P&amp;L</span>
                        <strong className="up__pnl-amt">{fmt(moPnl)}</strong>
                      </div>
                    </div>
                    <div className="up__pnl-right">
                      <span className="up__pnl-pct">{fmtPct(moPnlPct)}</span>
                      {moHoldings > 0 && (
                        <button
                          className="up__holdings-btn up__holdings-btn--active"
                          onClick={() => setShowHoldings(true)}  >
                          <LayersIcon style={{ fontSize: '0.85rem' }} />
                          {moHoldings} holding{moHoldings !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Invested / Current */}
                <div className="up__bal-grid up__bal-grid--no-border">
                  <BalBox label="Invested"      value={fmt(moInvested)} />
                  <BalBox label="Current value" value={fmt(moCurrent)} />
                </div>

              </div>
            )}

            {/* ── SHOONYA card ── */}
            {shoonya && (
              <div className="up__broker-card up__broker-card--shoonya">
                <div className="up__bc-head">
                  <div className="up__bc-logo up__bc-logo--shoonya">SH</div>
                  <div className="up__bc-title">
                    <span className="up__bc-name">Shoonya</span>
                    <span className="up__bc-uid">{shoonya.user_id ?? '—'}</span>
                  </div>
                  <BrokerPill auth={shoonya.is_authenticated} />
                </div>

                {shoonyaOk && sh ? (
                  <>
                    <div className="up__sh-rows">
                      <DetailRow label="Name "      value={sh.client_name?.trim() || sh.user_name?.trim()} />
                      <DetailRow label="Account status"  value={sh.account_status}
                        tag={sh.account_status === 'Activated' ? { text: 'Active', color: 'green' } : undefined} />
                      <DetailRow label="Role"            value={sh.role} />
                      <DetailRow label="Broker"          value={sh.broker_name} />
                      <DetailRow label="Exchanges"
                        value={sh.exchanges?.join(' · ')} />
                      <DetailRow label="Order types"
                        value={sh.order_types?.join(', ')} />
                    </div>
                  </>
                ) : shoonyaError ? (
                  <div className="up__bc-error">
                    <WarningAmberIcon style={{ fontSize: '1rem' }} />
                    <span>{shoonyaError}</span>
                  </div>
                ) : (
                  <div className="up__bc-empty">Profile not available</div>
                )}

              </div>
            )}
          </div>
        )}

      
        <div className="up__profile-sections">
          <div className="up__profile-block">
            <SectionHead icon={<BadgeIcon />} title="Personal information" />
            <div className="up__compare-row">
              <div className="up__compare-cell up__compare-cell--mo">
                <span className="up__compare-broker-tag up__compare-broker-tag--mo">Motilal</span>
                <span className="up__compare-lbl">Name</span>
                <span className="up__compare-val">{moName || '—'}</span>
              </div>
              {hasBoth && (
                <div className="up__compare-cell up__compare-cell--sh">
                  <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya </span>
                  <span className="up__compare-lbl">Name</span>
                  <span className="up__compare-val">
                    {sh?.client_name?.trim() || sh?.user_name?.trim() || '—'}
                  </span>
                </div>
              )}
            </div>

            <div className="up__compare-row">
              <div className="up__compare-cell up__compare-cell--mo">
                {!hasBoth && <span className="up__compare-broker-tag up__compare-broker-tag--mo">Motilal DB</span>}
                <span className="up__compare-lbl">
                  <AlternateEmailIcon style={{ fontSize: '0.75rem' }} /> Email
                </span>
                <span className="up__compare-val up__compare-val--mono">{moEmail}</span>
              </div>
              {hasBoth && (
                <div className={`up__compare-cell up__compare-cell--sh${emailSame ? ' up__compare-cell--same' : ''}`}>
                  <span className="up__compare-lbl">
                    <AlternateEmailIcon style={{ fontSize: '0.75rem' }} /> Email
                  </span>
                  <span className="up__compare-val up__compare-val--mono">
                    {shEmail}
                    {emailSame && <span className="up__same-tag">Same</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Phone row */}
            <div className="up__compare-row">
              <div className="up__compare-cell up__compare-cell--mo">
                {!hasBoth && <span className="up__compare-broker-tag up__compare-broker-tag--mo">Motilal DB</span>}
                <span className="up__compare-lbl">
                  <PhoneAndroidIcon style={{ fontSize: '0.75rem' }} /> Phone
                </span>
                <span className="up__compare-val up__compare-val--mono">{moPhone}</span>
              </div>
              {hasBoth && (
                <div className={`up__compare-cell up__compare-cell--sh${phoneSame ? ' up__compare-cell--same' : ''}`}>
                  <span className="up__compare-lbl">
                    <PhoneAndroidIcon style={{ fontSize: '0.75rem' }} /> Phone
                  </span>
                  <span className="up__compare-val up__compare-val--mono">
                    {shPhone}
                    {phoneSame && <span className="up__same-tag">Same</span>}
                  </span>
                </div>
              )}
            </div>

            {/* DOB — Shoonya only */}
            {sh?.dob && (
              <div className="up__compare-row">
                <div className="up__compare-cell up__compare-cell--sh up__compare-cell--full">
                  <span className="up__compare-lbl">
                    <CakeIcon style={{ fontSize: '0.75rem' }} /> Date of birth
                  </span>
                  <span className="up__compare-val">{sh.dob}</span>
                </div>
              </div>
            )}
          </div>

          {shoonyaOk && (sh?.pan || dpAccounts.length > 0) && (
            <div className="up__profile-block">
              <SectionHead icon={<CreditCardIcon />} title="KYC details" />

              {sh?.pan && (
                <div className="up__compare-row">
                  <div className="up__compare-cell up__compare-cell--sh up__compare-cell--full">
                    <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya</span>
                    <span className="up__compare-lbl">PAN number</span>
                    <span className="up__compare-val up__compare-val--mono">
                      {maskPan(sh.pan)}
                      <span className="up__kyc-reveal" title={sh.pan}>{sh.pan}</span>
                    </span>
                  </div>
                </div>
              )}

              {dpAccounts.map((dp, i) => (
                dp.dpnum && (
                  <div className="up__compare-row" key={i}>
                    <div className="up__compare-cell up__compare-cell--sh up__compare-cell--full">
                      <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya</span>
                      <span className="up__compare-lbl">DP account {dpAccounts.length > 1 ? i + 1 : ''}</span>
                      <span className="up__compare-val up__compare-val--mono">{dp.dpnum}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
          {shoonyaOk && bankDetails.length > 0 && (
            <div className="up__profile-block">
              <SectionHead icon={<AccountBalanceIcon />} title="Bank accounts" />

              {bankDetails.map((bank, i) => (
                <div className="up__bank-card" key={i}>
                  <div className="up__bank-header">
                    <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya </span>
                    <span className="up__bank-name">{bank.bankn || 'Bank'}</span>
                    {i === 0 && <span className="up__bank-primary-tag">Primary</span>}
                  </div>
                  <div className="up__bank-grid">
                    <div className="up__bank-field">
                      <span className="up__compare-lbl">Account number</span>
                      <span className="up__compare-val up__compare-val--mono">
                        {maskAcct(bank.acctnum)}
                        {bank.acctnum && (
                          <span className="up__kyc-reveal" title={bank.acctnum}>{bank.acctnum}</span>
                        )}
                      </span>
                    </div>
                    <div className="up__bank-field">
                      <span className="up__compare-lbl">IFSC code</span>
                      <span className="up__compare-val up__compare-val--mono">{bank.ifsc_code || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="up__profile-block">
            <SectionHead icon={<TagIcon />} title="Client IDs" />
            <div className={`up__compare-row${hasBoth ? '' : ''}`}>
              <div className="up__compare-cell up__compare-cell--mo">
                <span className="up__compare-broker-tag up__compare-broker-tag--mo">Motilal</span>
                <span className="up__compare-lbl">Client code</span>
                <span className="up__compare-val up__compare-val--mono">{clientCode}</span>
              </div>
              {shoonya && (
                <div className="up__compare-cell up__compare-cell--sh">
                  <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya</span>
                  <span className="up__compare-lbl">User ID (UID)</span>
                  <span className="up__compare-val up__compare-val--mono">
                    {shoonya.user_id || sh?.uid || '—'}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>{/* end .up__profile-sections */}

       
        <div className="up__actions">
          <button className="up__btn up__btn--primary" onClick={() => onNavigate('bulk-trading')}>
            <ShowChartIcon />Trade now
          </button>
          <button className="up__btn up__btn--ghost" onClick={() => onNavigate('trade-history')}>
            <HistoryIcon />History
          </button>
          <button
            className="up__btn up__btn--ghost up__btn--full"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshIcon className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

      </div>

      {showHoldings && (
        <>
          <div className="hd-backdrop" onClick={() => setShowHoldings(false)} />
          <HoldingsDrawer
            clientCode={clientCode}
            clientName={displayName}
            holdings={(client as any)?.holdings ?? []}
            onClose={() => setShowHoldings(false)}
          />
        </>
      )}
    </>
  );
};