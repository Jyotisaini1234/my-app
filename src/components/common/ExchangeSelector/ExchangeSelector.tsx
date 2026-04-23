import React from 'react';

export interface ExchangeOption {
  value:   string;
  label:   string;
  segment: 'equity' | 'fno' | 'commodity' | 'currency';
  desc:    string;
}

export const EXCHANGE_OPTIONS: ExchangeOption[] = [
  { value: 'NSE',   label: 'NSE',  segment: 'equity',    desc: 'NSE Equity' },
  { value: 'BSE',   label: 'BSE',  segment: 'equity',    desc: 'BSE Equity' },
  { value: 'NSEFO', label: 'NFO',  segment: 'fno',       desc: 'NSE Futures & Options' },
  { value: 'BSEFO', label: 'BFO',  segment: 'fno',       desc: 'BSE Futures & Options' },
  { value: 'MCX',   label: 'MCX',  segment: 'commodity', desc: 'Multi Commodity Exchange' },
  { value: 'NSECD', label: 'CDS',  segment: 'currency',  desc: 'NSE Currency Derivatives' }, 
  { value: 'BSECD', label: 'BCD',  segment: 'currency',  desc: 'BSE Currency Derivatives' }, 
];

const SEGMENT_LABELS: Record<string, string> = {
  equity:    'Equity',
  fno:       'Futures & Options',
  commodity: 'Commodity',
  currency:  'Currency',
};

interface ExchangeSelectorProps {
  value:    string;
  onChange: (exchange: string) => void;
}

export const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({ value, onChange }) => {
  const segments = ['equity', 'fno', 'commodity', 'currency'] as const;

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {segments.map(seg => {
        const options = EXCHANGE_OPTIONS.filter(o => o.segment === seg);
        return (
          <optgroup key={seg} label={SEGMENT_LABELS[seg]}>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
};