import React from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import './HoldingsDrawer.scss';
import { HoldingDetail } from '../../../types/type';

interface Props {
  clientCode: string;
  clientName?: string;
  holdings:   HoldingDetail[];
  onClose:    () => void;
}

const inr = (v: number) => {
  const abs = Math.abs(v);
  const fmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(abs);
  return `${v < 0 ? '−' : ''}₹${fmt}`;
};

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

export const HoldingsDrawer: React.FC<Props> = ({ clientCode, clientName, holdings, onClose }) => {
  const totalInvested = holdings.reduce((s, h) => s + h.invested_amount, 0);
  const totalCurrent  = holdings.reduce((s, h) => s + h.current_value,   0);
  const totalPnl      = totalCurrent - totalInvested;
  const totalPnlPct   = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <>
      {/* Drawer */}
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

        {/* Holdings list */}
        <div className="hd-list">
          {holdings.map((h, i) => {
            const isProfit = h.profit_loss > 0;
            const isLoss   = h.profit_loss < 0;
            return (
              <div key={h.isin ?? i} className="hd-card">
                <div className="hd-card__top">
                  <div className="hd-card__left">
                    <div className="hd-card__logo">
                      {h.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="hd-card__name">{h.name.replace(' EQ', '')}</div>
                      <div className="hd-card__isin">{h.isin}</div>
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

        <div className="hd-footer">{holdings.length} holding{holdings.length !== 1 ? 's' : ''}</div>
      </div>
    </>
  );
};