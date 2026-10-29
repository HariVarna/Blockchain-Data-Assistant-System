import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Copy, Check, Sparkles, Coins } from 'lucide-react';
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
  {
    name: 'Sample Exam Wallet (Full History)',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    desc: 'Matches bundled sample dataset with incoming, outgoing, self-transfer & contract creation'
  },
  {
    name: 'Sepolia Faucet',
    address: '0x6b75d8AF000000e20B7a7DDf000Ba900b4009A80',
    desc: 'High-volume testnet distributor'
  },
  {
    name: 'Vitalik (vitalik.eth)',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    desc: 'Widely recognized Ethereum address'
  }
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Ethereum Wallet Address
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Enter a standard 42-character Ethereum address (EIP-55 checksum supported).
          </p>
        </div>

        {/* Quick Demo Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
            Quick Presets:
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onSelectSampleAddress(e.target.value);
              }
            }}
            value=""
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="" disabled>Choose demo wallet...</option>
            {SAMPLE_ADDRESSES.map((item, idx) => (
              <option key={idx} value={item.address}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Box & Action */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input
            id="wallet-address-input"
            type="text"
            className="input-field"
            placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onValidate();
            }}
          />
          {addressInput && (
            <button
              onClick={() => setAddressInput('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Clear
            </button>
          )}
        </div>

        <button
          id="validate-address-btn"
          className="btn btn-secondary"
          onClick={onValidate}
        >
          Validate Address
        </button>
      </div>

      {/* Validation Message or Normalized Address Display */}
      {validationResult && (
        <div style={{ marginTop: '16px' }}>
          {validationResult.isValid ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                      Validated & Checksum Normalized:
                    </span>
                  </div>
                  <span
                    id="normalized-address-display"
                    style={{
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#f8fafc',
                      fontWeight: 600,
                      wordBreak: 'break-all'
                    }}
                  >
                    {validationResult.normalizedAddress}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Live Sepolia Balance Badge */}
                {balanceEth !== null && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <Coins size={14} />
                    <span>
                      {isLoadingBalance ? 'Fetching balance...' : `${balanceEth} Sepolia ETH`}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => validationResult.normalizedAddress && handleCopy(validationResult.normalizedAddress)}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  title="Copy Checksummed Address"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              id="wallet-validation-error"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#f43f5e',
                fontSize: '0.85rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{validationResult.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
