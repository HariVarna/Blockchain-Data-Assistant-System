import React, { useState } from 'react';
import { X, Check, AlertCircle, RefreshCw, Server } from 'lucide-react';
import { DEFAULT_SEPOLIA_RPC_URLS } from '../services/rpc';

interface RpcConfigModalProps {
  isOpen: boolean;
  currentRpc: string;
  onClose: () => void;
  onApplyRpc: (newRpc: string) => Promise<void>;
}

export const RpcConfigModal: React.FC<RpcConfigModalProps> = ({
  isOpen,
  currentRpc,
  onClose,
  onApplyRpc
}) => {
  const [selectedRpc, setSelectedRpc] = useState(currentRpc);
  const [customRpc, setCustomRpc] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = async (url: string) => {
    setIsTesting(true);
    setTestError(null);
    try {
      await onApplyRpc(url);
      onClose();
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          background: '#0f172a',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={20} style={{ color: '#38bdf8' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              Sepolia RPC Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
          Select a verified Ethereum Sepolia JSON-RPC endpoint or enter a custom RPC URL.
          The chain ID must strictly resolve to <strong>11155111</strong>.
        </p>

        {testError && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{testError}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
            Preset Sepolia RPC Providers:
          </span>
          {DEFAULT_SEPOLIA_RPC_URLS.map((url, i) => (
            <div
              key={i}
              onClick={() => setSelectedRpc(url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1px solid ${selectedRpc === url ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                background: selectedRpc === url ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                  {url}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Chain ID: 11155111 (Sepolia)
                </span>
              </div>
              {selectedRpc === url && <Check size={16} style={{ color: '#38bdf8' }} />}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Or Enter Custom RPC URL:
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="https://sepolia.infura.io/v3/YOUR_KEY"
            value={customRpc}
            onChange={(e) => {
              setCustomRpc(e.target.value);
              setSelectedRpc(e.target.value);
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={isTesting}>
            Cancel
          </button>
          <button
            onClick={() => handleApply(selectedRpc || customRpc)}
            className="btn btn-primary"
            disabled={isTesting || (!selectedRpc && !customRpc)}
          >
            {isTesting ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Verifying Endpoint...
              </>
            ) : (
              'Connect & Verify'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
