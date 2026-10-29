import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Copy, Check, Coins } from 'lucide-react';
import { WalletValidationResult } from '../types/transaction';

interface WalletInputProps {
  addressInput: string;
  setAddressInput: (val: string) => void;
  validationResult: WalletValidationResult | null;
  onValidate: () => void;
  onSelectSampleAddress: (addr: string) => void;
  balanceEth: string | null;
  isLoadingBalance: boolean;
}

const SAMPLE_ADDRESSES = [
  { name: 'Exam Wallet', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
  { name: 'Sepolia Faucet', address: '0x6b75d8AF000000e20B7a7DDf000Ba900b4009A80' },
  { name: 'Vitalik (vitalik.eth)', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }
];

export const WalletInput: React.FC<WalletInputProps> = ({
  addressInput,
  setAddressInput,
  validationResult,
  onValidate,
  onSelectSampleAddress,
  balanceEth,
  isLoadingBalance
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="minimal-card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fafafa' }}>
          Wallet Address
        </span>
        <select
          onChange={(e) => {
            if (e.target.value) onSelectSampleAddress(e.target.value);
          }}
          value=""
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            fontSize: '0.75rem',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="" disabled style={{ background: '#121215' }}>Quick Presets...</option>
          {SAMPLE_ADDRESSES.map((item, idx) => (
            <option key={idx} value={item.address} style={{ background: '#121215', color: '#fafafa' }}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            id="wallet-address-input"
            type="text"
            className="input-field"
            placeholder="0x..."
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onValidate();
            }}
          />
        </div>

        <button
          id="validate-address-btn"
          className="btn btn-secondary"
          onClick={onValidate}
        >
          Validate
        </button>
      </div>

      {validationResult && (
        <div style={{ marginTop: '10px' }}>
          {validationResult.isValid ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#18181b',
                border: '1px solid #27272a',
                fontSize: '0.78rem',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#34d399' }} />
                <span
                  id="normalized-address-display"
                  className="font-mono"
                  style={{ color: '#fafafa' }}
                >
                  {validationResult.normalizedAddress}
                </span>
                <button
                  onClick={() => validationResult.normalizedAddress && handleCopy(validationResult.normalizedAddress)}
                  style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', padding: '1px' }}
                  title="Copy"
                >
                  {copied ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                </button>
              </div>

              {balanceEth !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#a1a1aa', fontSize: '0.75rem' }}>
                  <Coins size={12} />
                  <span>{isLoadingBalance ? 'Loading...' : `${balanceEth} ETH`}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              id="wallet-validation-error"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'rgba(248, 113, 113, 0.08)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: '#f87171',
                fontSize: '0.75rem'
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              <span>{validationResult.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
