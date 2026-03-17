import React, { useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TagIcon from '@mui/icons-material/Tag';
import LayersIcon from '@mui/icons-material/Layers';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import './Userportal.scss'; 
import { NavPage, Client } from '../../../types/type';
import { HoldingsDrawer } from '../../common/HoldingsDrawer/HoldingsDrawer';

const fmt = (v: number | null | undefined, fallback = '—') => {
  if (v == null) return fallback;
  const abs = Math.abs(v);
  const str = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(abs);
  return `${v < 0 ? '−' : ''}₹${str}`;
};

const fmtPct = (v: number | null | undefined) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

interface UserInfo {
  clientCode?: string;
  name?:       string;
  email?:      string;
  phone?:      string;
  city?:       string;
  [key: string]: unknown;  
}

interface UserPortalProps {
  client?:    Client;
  user?:      UserInfo;      
  loading?:   boolean;
  onNavigate: (page: NavPage) => void;
  onRefresh?: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({client, user, loading = false,onNavigate,onRefresh,}) => {
  const [showHoldings, setShowHoldings] = useState(false);
  const isActive  = client?.is_active;
  const displayName = client?.client_name && client.client_name !== '—'? client.client_name : user?.name || user?.clientCode || 'User';
  let invested = client?.invested_amount  ?? null;
  let current  = client?.current_value  ?? null;
  let pnl = client?.profit_loss ?? null;
  let pnlPct = client?.profit_loss_pct  ?? null;
  let holdings = client?.total_holdings  ?? 0;
  let isProfit = (pnl ?? 0) >= 0;
  let avail = client?.available_cash   ?? null;
  let used = client?.used_margin      ?? null;
  let ledger = client?.ledger_balance   ?? null;
  let collat = client?.collateral_value ?? null;
  let isNegBal = avail != null && avail < 0;

  const isEnrichedLoading = loading || (client != null && invested == null && avail == null);

  const infoRows = [
    { icon: <TagIcon />,                label: 'Client Code', value: user?.clientCode || '—', mono: true,  accent: true },
    { icon: <AlternateEmailIcon />,     label: 'Email',       value: user?.email as string,   mono: true               },
    { icon: <PhoneAndroidIcon />,       label: 'Phone',       value: user?.phone as string                             },
    { icon: <LocationOnOutlinedIcon />, label: 'City',        value: user?.city  as string                             },
  ].filter(r => r.value);

  return (
    <>
      <div className="up">
        <div className="up__hero">
          <div className="up__hero-top">
            <span className="up__badge">
              <FiberManualRecordIcon className="up__badge-dot" />Client Portal
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
              <span className="up__code">{user?.clientCode || '—'}</span>
            </div>
          </div>
        </div>

        <div className="up__pf">

          {isEnrichedLoading && (
            <div className="up__pf-loading">
              <RefreshIcon className="spin" />
              <span>Loading portfolio &amp; balance…</span>
            </div>
          )}

          <div className="up__pf-row">
            <div className="up__pf-box">
              <ShowChartIcon className="up__pf-ico up__pf-ico--blue" />
              <span className="up__pf-lbl">Total Invested</span>
              <strong className="up__pf-val">{fmt(invested)}</strong>
            </div>
            <div className="up__pf-box">
              <AccountBalanceIcon className="up__pf-ico up__pf-ico--purple" />
              <span className="up__pf-lbl">Current Value</span>
              <strong className="up__pf-val">{fmt(current)}</strong>
            </div>
          </div>

          {/* P&L banner */}
          {pnl != null && (
            <div className={`up__pf-pnl up__pf-pnl--${isProfit ? 'profit' : 'loss'}`}>
              <div className="up__pf-pnl-left">
                {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
                <div>
                  <span className="up__pf-lbl">
                    {isProfit ? 'Total Profit' : 'Total Loss'}
                  </span>
                  <strong className="up__pf-amt">{fmt(pnl)}</strong>
                </div>
              </div>
              <div className="up__pf-pnl-right">
                <span className="up__pf-pct">{fmtPct(pnlPct)}</span>

                {/* ← holdings pill — click to open drawer */}
                <button
                  className={`up__holdings-btn${holdings > 0 ? ' up__holdings-btn--active' : ''}`}
                  onClick={() => holdings > 0 && setShowHoldings(true)}
                  disabled={holdings === 0}
                  title={holdings > 0 ? 'View all holdings' : 'No holdings'}
                >
                  <LayersIcon />
                  {holdings} holding{holdings !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Balance row */}
          <div className="up__pf-row up__pf-row--3">
            <div className={`up__pf-box${isNegBal ? ' up__pf-box--warn' : ''}`}>
              {isNegBal
                ? <WarningAmberIcon className="up__pf-ico up__pf-ico--warn" />
                : <AccountBalanceWalletIcon className="up__pf-ico up__pf-ico--green" />}
              <span className="up__pf-lbl">Available Cash</span>
              <strong className={`up__pf-val${isNegBal ? ' up__pf-val--neg' : ''}`}>
                {fmt(avail)}
              </strong>
              {isNegBal && <span className="up__pf-warn-tag">Deficit</span>}
            </div>
            <div className="up__pf-box">
              <AccountBalanceWalletIcon className="up__pf-ico up__pf-ico--orange" />
              <span className="up__pf-lbl">Used Margin</span>
              <strong className="up__pf-val">{fmt(used)}</strong>
            </div>
            <div className="up__pf-box">
              <AccountBalanceIcon className="up__pf-ico up__pf-ico--blue" />
              <span className="up__pf-lbl">Ledger Balance</span>
              <strong className={`up__pf-val${(ledger ?? 0) < 0 ? ' up__pf-val--neg' : ''}`}>
                {fmt(ledger)}
              </strong>
            </div>
          </div>

          {/* Collateral */}
          {collat != null && collat !== 0 && (
            <div className="up__pf-collateral">
              <span className="up__pf-lbl">Collateral (Pledged stocks)</span>
              <strong className="up__pf-val">{fmt(collat)}</strong>
            </div>
          )}
        </div>

        {/* ── Account Details ──────────────────────────────────── */}
        <div className="up__body">
          <p className="up__section-lbl">Account Details</p>
          {infoRows.map(r => (
            <div key={r.label} className={`up__row${r.accent ? ' up__row--accent' : ''}`}>
              <span className="up__row-icon">{r.icon}</span>
              <div className="up__row-meta">
                <span className="up__row-lbl">{r.label}</span>
                <span className={`up__row-val${r.mono ? ' up__row-val--mono' : ''}`}>
                  {r.value}
                </span>
              </div>
              {r.label === 'Client Code' && (
                <span className={`up__tag up__tag--${isActive ? 'ok' : 'err'}`}>
                  {isActive ? 'Live' : 'Off'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="up__actions">
          <button className="up__btn up__btn--primary" onClick={() => onNavigate('bulk-trading')} >
            <ShowChartIcon />Trade Now
          </button>
          <button className="up__btn up__btn--ghost" onClick={() => onNavigate('trade-history')}>
            <HistoryIcon />History
          </button>
          <button className="up__btn up__btn--ghost up__btn--full" onClick={onRefresh} disabled={loading} >
            <RefreshIcon className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Holdings Drawer ───────────────────────────────────── */}
      {showHoldings && (
        <>
          <div className="hd-backdrop" onClick={() => setShowHoldings(false)} />
          <HoldingsDrawer
            clientCode={user?.clientCode ?? client?.client_code ?? ''}
            clientName={displayName}
            holdings={client?.holdings ?? []}
            onClose={() => setShowHoldings(false)}
          />
        </>
      )}
    </>
  );
};