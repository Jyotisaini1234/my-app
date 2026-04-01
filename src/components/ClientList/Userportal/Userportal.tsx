import React, { useState } from 'react';
import RefreshIcon         from '@mui/icons-material/Refresh';
import ShowChartIcon       from '@mui/icons-material/ShowChart';
import HistoryIcon         from '@mui/icons-material/History';
import VerifiedUserIcon    from '@mui/icons-material/VerifiedUser';
import ErrorOutlineIcon    from '@mui/icons-material/ErrorOutline';
import TrendingUpIcon      from '@mui/icons-material/TrendingUp';
import TrendingDownIcon    from '@mui/icons-material/TrendingDown';
import WarningAmberIcon    from '@mui/icons-material/WarningAmber';
import AlternateEmailIcon  from '@mui/icons-material/AlternateEmail';
import PhoneAndroidIcon    from '@mui/icons-material/PhoneAndroid';
import TagIcon             from '@mui/icons-material/Tag';
import LayersIcon          from '@mui/icons-material/Layers';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SwapHorizIcon       from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon  from '@mui/icons-material/AccountBalance';
import BadgeIcon           from '@mui/icons-material/Badge';
import CakeIcon            from '@mui/icons-material/Cake';
import CreditCardIcon      from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import './Userportal.scss';
import { NavPage, Client, HoldingDetail } from '../../../types/type';
import { HoldingsDrawer } from '../../common/HoldingsDrawer/HoldingsDrawer';
import { BankDetail, BrokerEntry, DpAccount, ShoonyaProfile, UserInfo } from '../../../types/profile';

// ─── Formatters ───────────────────────────────────────────────────────────────
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

const maskPan  = (pan?:  string) => pan  ? `${'•'.repeat(pan.length  - 4)}${pan.slice(-4)}`                       : '—';
const maskAcct = (num?:  string) => num  ? `${'•'.repeat(Math.max(0, num.length - 4))}${num.slice(-4)}`           : '—';

// ─── Data helpers (same shape as PortfolioPage helpers) ───────────────────────

/** Portfolio object for a given broker — e.g. motilal_portfolio / shoonya_portfolio */
const getBrokerPortfolio = (c: any, broker: string): any | null =>
  c?.[`${broker.toLowerCase()}_portfolio`] ?? null;

/** Balance object for a given broker, returns null if fetch failed */
const getBrokerBalance = (c: any, broker: string): any | null => {
  const b = c?.balances?.[broker];
  if (!b || b.stat === 'Not_Ok' || b.status === 'ERROR') return null;
  return b;
};

/** Normalise a raw holding to HoldingDetail shape */
const normaliseHolding = (h: any, broker: string): HoldingDetail => ({
  name:            h.name    ?? h.symbol   ?? '—',
  symbol:          h.symbol,
  exchange:        h.exchange,
  isin:            h.isin,
  quantity:        h.quantity ?? h.qty     ?? 0,
  avg_price:       h.avg_price ?? 0,
  ltp:             h.ltp       ?? 0,
  invested_amount: h.invested_amount ?? 0,
  current_value:   h.current_value   ?? 0,
  profit_loss:     h.profit_loss     ?? 0,
  profit_loss_pct: h.profit_loss_pct ?? 0,
  source:          broker,
  nse_token:       h.nse_token ?? 0,
  bse_token:       h.bse_token ?? 0,
});

/** Returns HoldingDetail[] for a single broker */
const getBrokerHoldings = (c: any, broker: string): HoldingDetail[] =>
  (getBrokerPortfolio(c, broker)?.holdings ?? [])
    .filter((h: any) => (h.quantity ?? h.qty ?? 0) > 0)   // skip zero-qty rows
    .map((h: any) => normaliseHolding(h, broker));

/** All broker portfolios as a map — passed to HoldingsDrawer */
const getAllBrokerPortfolios = (c: any): Record<string, any> => {
  const brokers: Record<string, any> = c?.brokers ?? {};
  return Object.keys(brokers).reduce((acc, broker) => {
    const p = getBrokerPortfolio(c, broker);
    if (p) acc[broker] = p;
    return acc;
  }, {} as Record<string, any>);
};

// ─── Small reusable pieces ────────────────────────────────────────────────────

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

const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  tag?:  { text: string; color: 'green' | 'blue' | 'warn' };
}> = ({ label, value, mono, tag }) => (
  <div className="up__detail-row">
    <span className="up__detail-lbl">{label}</span>
    <span className={`up__detail-val${mono ? ' up__detail-val--mono' : ''}`}>{value || '—'}</span>
    {tag && <span className={`up__detail-tag up__detail-tag--${tag.color}`}>{tag.text}</span>}
  </div>
);

/** A P&L + holdings button banner, used for both Motilal and Shoonya */
const PnlBanner: React.FC<{
  pnl:       number;
  pnlPct:    number;
  holdCount: number;
  onViewHoldings: () => void;
}> = ({ pnl, pnlPct, holdCount, onViewHoldings }) => {
  const isProfit = pnl >= 0;
  return (
    <div className={`up__pnl-banner up__pnl-banner--${isProfit ? 'profit' : 'loss'}`}>
      <div className="up__pnl-left">
        {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
        <div>
          <span className="up__pnl-lbl">P&amp;L</span>
          <strong className="up__pnl-amt">{fmt(pnl)}</strong>
        </div>
      </div>
      <div className="up__pnl-right">
        <span className="up__pnl-pct">{fmtPct(pnlPct)}</span>
        {holdCount > 0 && (
          <button className="up__holdings-btn up__holdings-btn--active" onClick={onViewHoldings}>
            <LayersIcon style={{ fontSize: '0.85rem' }} />
            {holdCount} holding{holdCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Drawer state type ────────────────────────────────────────────────────────
interface DrawerState {
  holdings:         HoldingDetail[];
  brokerPortfolios: Record<string, any>;
  label:            string;         // shown as clientCode in drawer header
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface UserPortalProps {
  client?:    Client;
  user?:      UserInfo;
  loading?:   boolean;
  onNavigate: (page: NavPage) => void;
  onRefresh?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const UserPortal: React.FC<UserPortalProps> = ({
  client, user, loading = false, onNavigate, onRefresh,
}) => {
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  const c = client as any;

  // ── Broker entries ─────────────────────────────────────────────────────────
  const brokersMap = (c?.brokers ?? {}) as Record<string, BrokerEntry>;
  const motilal    = brokersMap['MOTILAL'] as BrokerEntry | undefined;
  const shoonya    = brokersMap['SHOONYA'] as BrokerEntry | undefined;
  const hasBoth    = !!motilal && !!shoonya;

  // ── Shoonya profile ────────────────────────────────────────────────────────
  const sh         = (c?.shoonya_profile ?? null) as ShoonyaProfile | null;
  const shoonyaOk  = sh?.stat === 'Ok';
  const shoonyaError = !shoonyaOk ? (sh?.emsg || sh?.message || null) : null;

  // ── Motilal portfolio + balance ────────────────────────────────────────────
  const moPf       = getBrokerPortfolio(c, 'MOTILAL');
  const moBal      = getBrokerBalance(c, 'MOTILAL');
  const moInvested = moPf?.invested_amount   ?? null;
  const moCurrent  = moPf?.current_value     ?? null;
  const moPnl      = moPf?.profit_loss       ?? null;
  const moPnlPct   = moPf?.profit_loss_pct   ?? null;
  const moHoldCount= moPf?.total_holdings    ?? 0;
  const moAvail    = moBal?.available_cash   ?? null;
  const moUsed     = moBal?.used_margin      ?? null;
  const moLedger   = moBal?.ledger_balance   ?? null;
  const moCollat   = moBal?.collateral_value ?? null;

  // ── Shoonya portfolio + balance ────────────────────────────────────────────
  const shPf        = getBrokerPortfolio(c, 'SHOONYA');
  const shBal       = getBrokerBalance(c, 'SHOONYA');
  const shInvested  = shPf?.invested_amount  ?? null;
  const shCurrent   = shPf?.current_value    ?? null;
  const shPnl       = shPf?.profit_loss      ?? null;
  const shPnlPct    = shPf?.profit_loss_pct  ?? null;
  const shHoldCount = shPf?.total_holdings   ?? 0;
  const shAvail     = shBal?.available_cash  ?? null;
  const shUsed      = shBal?.used_margin     ?? null;

  // ── Display name / identity ────────────────────────────────────────────────
  const shName     = sh?.client_name?.trim() || sh?.user_name?.trim() || '';
  const moName     = c?.name || c?.client_name || '';
  const displayName = (shoonyaOk && shName) ? shName : moName || user?.name || user?.clientCode || 'User';
  const isActive   = c?.is_active;
  const clientCode = c?.client_code ?? user?.clientCode ?? '—';

  // ── Contact / KYC ──────────────────────────────────────────────────────────
  const moEmail    = c?.email      || '—';
  const shEmail    = sh?.email     || '—';
  const emailSame  = moEmail !== '—' && moEmail === shEmail;
  const moPhone    = c?.phone ? String(c.phone) : '—';
  const shPhone    = sh?.mobile    || '—';
  const phoneSame  = moPhone !== '—' && moPhone === shPhone;
  const bankDetails  = (sh?.bank_details ?? []) as BankDetail[];
  const dpAccounts   = (sh?.dp_account   ?? []) as DpAccount[];

  // ── Loading guard ──────────────────────────────────────────────────────────
  // Show loading strip if client is present but no portfolio/balance yet
  const isEnrichedLoading = loading || (client != null && moInvested == null && moAvail == null && shInvested == null);

  // ── Holdings drawer openers ────────────────────────────────────────────────
  const openMoHoldings = () => {
    const holdings = getBrokerHoldings(c, 'MOTILAL');
    setDrawer({ holdings, brokerPortfolios: { MOTILAL: moPf }, label: motilal?.user_id ?? clientCode });
  };

  const openShHoldings = () => {
    const holdings = getBrokerHoldings(c, 'SHOONYA');
    setDrawer({ holdings, brokerPortfolios: { SHOONYA: shPf }, label: shoonya?.user_id ?? clientCode });
  };

  const openAllHoldings = () => {
    const moH = getBrokerHoldings(c, 'MOTILAL');
    const shH = getBrokerHoldings(c, 'SHOONYA');
    setDrawer({
      holdings:         [...moH, ...shH],
      brokerPortfolios: getAllBrokerPortfolios(c),
      label:            clientCode,
    });
  };

  return (
    <>
      <div className="up">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
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

          {/* Combined P&L strip in hero when both brokers exist */}
          {hasBoth && (moPnl != null || shPnl != null) && (
            <div className="up__hero-pnl-strip">
              {moPnl != null && (
                <div className={`up__hero-pnl-item up__hero-pnl-item--${moPnl >= 0 ? 'profit' : 'loss'}`}>
                  <span className="up__hero-pnl-broker">MO</span>
                  <span className="up__hero-pnl-val">{fmt(moPnl)}</span>
                  <span className="up__hero-pnl-pct">{fmtPct(moPnlPct)}</span>
                </div>
              )}
              {shPnl != null && (
                <div className={`up__hero-pnl-item up__hero-pnl-item--${shPnl >= 0 ? 'profit' : 'loss'}`}>
                  <span className="up__hero-pnl-broker">SH</span>
                  <span className="up__hero-pnl-val">{fmt(shPnl)}</span>
                  <span className="up__hero-pnl-pct">{fmtPct(shPnlPct)}</span>
                </div>
              )}
              <button className="up__hero-all-holdings" onClick={openAllHoldings}>
                <LayersIcon style={{ fontSize: '0.85rem' }} />
                All holdings ({(moHoldCount) + (shHoldCount)})
              </button>
            </div>
          )}
        </div>

        {/* ── Loading strip ─────────────────────────────────────────────── */}
        {isEnrichedLoading && (
          <div className="up__loading-strip">
            <RefreshIcon className="spin" />
            <span>Loading portfolio &amp; balance…</span>
          </div>
        )}

        {/* ── Broker cards ──────────────────────────────────────────────── */}
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

                {/* Balances — from c.balances.MOTILAL */}
                <div className="up__bal-grid">
                  <BalBox label="Available cash" value={fmt(moAvail)}   neg={(moAvail  ?? 0) < 0} />
                  <BalBox label="Used margin"    value={fmt(moUsed)} />
                  <BalBox label="Ledger balance" value={fmt(moLedger)}  neg={(moLedger ?? 0) < 0} />
                  <BalBox label="Collateral"     value={fmt(moCollat)} />
                </div>

                {/* P&L — from c.motilal_portfolio */}
                {moPnl != null && (
                  <PnlBanner
                    pnl={moPnl}
                    pnlPct={moPnlPct ?? 0}
                    holdCount={moHoldCount}
                    onViewHoldings={openMoHoldings}
                  />
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

                {/* Shoonya balance — from c.balances.SHOONYA (may be null on timeout) */}
                {shBal ? (
                  <div className="up__bal-grid">
                    <BalBox label="Available cash" value={fmt(shAvail)} neg={(shAvail ?? 0) < 0} />
                    <BalBox label="Used margin"    value={fmt(shUsed)} />
                  </div>
                ) : (
                  <div className="up__bc-warn-strip">
                    <WarningAmberIcon style={{ fontSize: '0.875rem' }} />
                    <span>Balance unavailable</span>
                  </div>
                )}

                {/* Shoonya P&L — from c.shoonya_portfolio */}
                {shPnl != null && (
                  <PnlBanner
                    pnl={shPnl}
                    pnlPct={shPnlPct ?? 0}
                    holdCount={shHoldCount}
                    onViewHoldings={openShHoldings}
                  />
                )}

                {/* Shoonya Invested / Current */}
                {shInvested != null && (
                  <div className="up__bal-grid up__bal-grid--no-border">
                    <BalBox label="Invested"      value={fmt(shInvested)} />
                    <BalBox label="Current value" value={fmt(shCurrent)} />
                  </div>
                )}

                {/* Shoonya profile details */}
                {shoonyaOk && sh ? (
                  <div className="up__sh-rows">
                    <DetailRow label="Account status" value={sh.account_status}
                      tag={sh.account_status === 'Activated' ? { text: 'Active', color: 'green' } : undefined} />
                    <DetailRow label="Role"        value={sh.role} />
                    <DetailRow label="Broker"      value={sh.broker_name} />
                    <DetailRow label="Exchanges"   value={sh.exchanges?.join(' · ')} />
                    <DetailRow label="Order types" value={sh.order_types?.join(', ')} />
                  </div>
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

        {/* ── Profile sections ──────────────────────────────────────────── */}
        <div className="up__profile-sections">

          {/* Personal information */}
          <div className="up__profile-block">
            <SectionHead icon={<BadgeIcon />} title="Personal information" />

            {/* Name */}
            <div className="up__compare-row">
              <div className="up__compare-cell up__compare-cell--mo">
                <span className="up__compare-broker-tag up__compare-broker-tag--mo">Motilal</span>
                <span className="up__compare-lbl">Name</span>
                <span className="up__compare-val">{moName || '—'}</span>
              </div>
              {hasBoth && (
                <div className="up__compare-cell up__compare-cell--sh">
                  <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya</span>
                  <span className="up__compare-lbl">Name</span>
                  <span className="up__compare-val">{sh?.client_name?.trim() || sh?.user_name?.trim() || '—'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="up__compare-row">
              <div className="up__compare-cell up__compare-cell--mo">
                {!hasBoth && <span className="up__compare-broker-tag up__compare-broker-tag--mo">Motilal</span>}
                <span className="up__compare-lbl"><AlternateEmailIcon style={{ fontSize: '0.75rem' }} /> Email</span>
                <span className="up__compare-val up__compare-val--mono">{moEmail}</span>
              </div>
              {hasBoth && (
                <div className={`up__compare-cell up__compare-cell--sh${emailSame ? ' up__compare-cell--same' : ''}`}>
                  <span className="up__compare-lbl"><AlternateEmailIcon style={{ fontSize: '0.75rem' }} /> Email</span>
                  <span className="up__compare-val up__compare-val--mono">
                    {shEmail}
                    {emailSame && <span className="up__same-tag">Same</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="up__compare-row">
              <div className="up__compare-cell up__compare-cell--mo">
                {!hasBoth && <span className="up__compare-broker-tag up__compare-broker-tag--mo">Motilal</span>}
                <span className="up__compare-lbl"><PhoneAndroidIcon style={{ fontSize: '0.75rem' }} /> Phone</span>
                <span className="up__compare-val up__compare-val--mono">{moPhone}</span>
              </div>
              {hasBoth && (
                <div className={`up__compare-cell up__compare-cell--sh${phoneSame ? ' up__compare-cell--same' : ''}`}>
                  <span className="up__compare-lbl"><PhoneAndroidIcon style={{ fontSize: '0.75rem' }} /> Phone</span>
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
                  <span className="up__compare-lbl"><CakeIcon style={{ fontSize: '0.75rem' }} /> Date of birth</span>
                  <span className="up__compare-val">{sh.dob}</span>
                </div>
              </div>
            )}
          </div>

          {/* KYC details — Shoonya only */}
          {shoonyaOk && (sh?.pan || dpAccounts.length > 0) && (
            <div className="up__profile-block">
              <SectionHead icon={<CreditCardIcon />} title="KYC details" />
              {sh?.pan && (
                <div className="up__compare-row">
                  <div className="up__compare-cell up__compare-cell--sh up__compare-cell--full">
                    <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya</span>
                    <span className="up__compare-lbl">PAN number</span>
                    <span className="up__compare-val up__compare-val--mono" title={sh.pan}>
                      {maskPan(sh.pan)}
                    </span>
                  </div>
                </div>
              )}
              {dpAccounts.map((dp, i) => dp.dpnum && (
                <div className="up__compare-row" key={i}>
                  <div className="up__compare-cell up__compare-cell--sh up__compare-cell--full">
                    <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya</span>
                    <span className="up__compare-lbl">DP account {dpAccounts.length > 1 ? i + 1 : ''}</span>
                    <span className="up__compare-val up__compare-val--mono">{dp.dpnum}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bank accounts — Shoonya only */}
          {shoonyaOk && bankDetails.length > 0 && (
            <div className="up__profile-block">
              <SectionHead icon={<AccountBalanceIcon />} title="Bank accounts" />
              {bankDetails.map((bank, i) => (
                <div className="up__bank-card" key={i}>
                  <div className="up__bank-header">
                    <span className="up__compare-broker-tag up__compare-broker-tag--sh">Shoonya</span>
                    <span className="up__bank-name">{bank.bankn || 'Bank'}</span>
                    {i === 0 && <span className="up__bank-primary-tag">Primary</span>}
                  </div>
                  <div className="up__bank-grid">
                    <div className="up__bank-field">
                      <span className="up__compare-lbl">Account number</span>
                      <span className="up__compare-val up__compare-val--mono" title={bank.acctnum}>
                        {maskAcct(bank.acctnum)}
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

          {/* Client IDs */}
          <div className="up__profile-block">
            <SectionHead icon={<TagIcon />} title="Client IDs" />
            <div className="up__compare-row">
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
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
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

      {/* ── Holdings Drawer ────────────────────────────────────────────── */}
      {drawer && (
        <>
          <div className="hd-backdrop" onClick={() => setDrawer(null)} />
          <HoldingsDrawer
            clientCode={drawer.label}
            clientName={displayName}
            holdings={drawer.holdings}
            brokerPortfolios={drawer.brokerPortfolios}
            onClose={() => setDrawer(null)}
          />
        </>
      )}
    </>
  );
};