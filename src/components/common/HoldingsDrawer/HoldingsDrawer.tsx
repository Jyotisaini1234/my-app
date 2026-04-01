import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import './HoldingsDrawer.scss';
import { HoldingDetail } from '../../../types/type';

interface Props {
  clientCode:       string;
  clientName?:      string;
  holdings:         HoldingDetail[];
  brokerPortfolios: Record<string, any>; // dynamic — koi bhi broker ho
  onClose:          () => void;
}

const inr = (v: number) => {
  const abs = Math.abs(v);
  const fmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return `${v < 0 ? '−' : ''}₹${fmt}`;
};
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

export const HoldingsDrawer: React.FC<Props> = ({
  clientCode, clientName, holdings, brokerPortfolios, onClose
}) => {
  const brokerNames  = Object.keys(brokerPortfolios);
  const hasMultiple  = brokerNames.length > 1;

  // Tab = 'ALL' | broker name (dynamic)
  const [tab, setTab] = useState<string>('ALL');

  const filtered = tab === 'ALL'
    ? holdings
    : holdings.filter(h => h.source === tab);

  const totalInvested = filtered.reduce((s, h) => s + h.invested_amount, 0);
  const totalCurrent  = filtered.reduce((s, h) => s + h.current_value,   0);
  const totalPnl      = totalCurrent - totalInvested;
  const totalPnlPct   = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const holdingCount = (broker: string) =>
    broker === 'ALL'
      ? holdings.length
      : (brokerPortfolios[broker]?.total_holdings ?? 0);

  return (
    <div className="hd-drawer">

      {/* Header */}
      <div className="hd-header">
        <div className="hd-header__info">
          <div className="hd-header__avatar">
            {(clientName ?? clientCode)[0]?.toUpperCase()}
          </div>
          <div>
            <div className="hd-header__code">{clientCode}</div>
            {clientName && clientName !== '—' && (
              <div className="hd-header__name">{clientName}</div>
            )}
          </div>
        </div>
        <button className="hd-close" onClick={onClose}><X size={18} /></button>
      </div>

      {/* Tabs — only if multiple brokers */}
      {hasMultiple && (
        <div className="hd-tabs">
          {['ALL', ...brokerNames].map(t => (
            <button key={t}
              className={`hd-tab ${tab === t ? 'hd-tab--active' : ''}`}
              onClick={() => setTab(t)}>
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              <span className="hd-tab__count">{holdingCount(t)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Summary strip */}
      <div className="hd-summary">
        <div className="hd-summary__item">
          <span className="hd-summary__lbl">Invested</span>
          <span className="hd-summary__val">{inr(totalInvested)}</span>
        </div>
        <div className="hd-summary__item">
          <span className="hd-summary__lbl">Current</span>
          <span className="hd-summary__val">{inr(totalCurrent)}</span>
        </div>
        <div className={`hd-summary__item ${totalPnl >= 0 ? 'hd-summary__item--up' : 'hd-summary__item--down'}`}>
          <span className="hd-summary__lbl">P&amp;L</span>
          <span className="hd-summary__val">
            {inr(totalPnl)}
            <span className="hd-summary__pct">{pct(totalPnlPct)}</span>
          </span>
        </div>
      </div>

      {/* Holdings list */}
      <div className="hd-list">
        {filtered.map((h, i) => {
          const isProfit    = h.profit_loss > 0;
          const isLoss      = h.profit_loss < 0;
          const displayName = h.name ?? h.symbol ?? '—';
          return (
            <div key={h.isin ?? h.symbol ?? i} className="hd-card">
              <div className="hd-card__top">
                <div className="hd-card__left">
                  <div className="hd-card__logo">
                    {displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="hd-card__name">{displayName.replace(/-EQ$/i, '').replace(' EQ', '')}</div>
                    <div className="hd-card__meta">
                      {h.isin     && <span className="hd-card__isin">{h.isin}</span>}
                      {h.exchange && <span className="hd-card__exch">{h.exchange}</span>}
                      {/* Source badge — only in ALL tab, fully dynamic */}
                      {tab === 'ALL' && h.source && (
                        <span className="hd-card__source" title={h.source}>
                          {h.source.substring(0, 1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`hd-card__pnl ${isProfit ? 'hd-card__pnl--up' : isLoss ? 'hd-card__pnl--down' : ''}`}>
                  {isProfit ? <TrendingUp size={13} /> : isLoss ? <TrendingDown size={13} /> : null}
                  {inr(h.profit_loss)}
                  <span className="hd-card__pct">{pct(h.profit_loss_pct)}</span>
                </div>
              </div>

              <div className="hd-card__grid">
                <div className="hd-card__stat">
                  <span className="hd-card__stat-lbl">Qty</span>
                  <span className="hd-card__stat-val">{h.quantity}</span>
                </div>
                <div className="hd-card__stat">
                  <span className="hd-card__stat-lbl">Avg Price</span>
                  <span className="hd-card__stat-val">{inr(h.avg_price)}</span>
                </div>
                <div className="hd-card__stat">
                  <span className="hd-card__stat-lbl">LTP</span>
                  <span className="hd-card__stat-val">{inr(h.ltp)}</span>
                </div>
                <div className="hd-card__stat">
                  <span className="hd-card__stat-lbl">Invested</span>
                  <span className="hd-card__stat-val">{inr(h.invested_amount)}</span>
                </div>
                <div className="hd-card__stat">
                  <span className="hd-card__stat-lbl">Current</span>
                  <span className="hd-card__stat-val">{inr(h.current_value)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hd-footer">{filtered.length} holding{filtered.length !== 1 ? 's' : ''}</div>
    </div>
  );
};