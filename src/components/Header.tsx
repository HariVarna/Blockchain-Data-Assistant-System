import React from 'react';
import { Activity, ShieldCheck, WifiOff, RefreshCw } from 'lucide-react';
import { NetworkInfo } from '../types/transaction';

interface HeaderProps {
  networkInfo: NetworkInfo | null;
  isConnecting: boolean;
  connectionError: string | null;
  onRefreshNetwork: () => void;
  onOpenRpcConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  networkInfo,
  isConnecting,
  connectionError,
  onRefreshNetwork,
  onOpenRpcConfig
}) => {
  return (
    <header className="glass-panel" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Title and Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <Activity size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Blockchain Wallet Activity Assistant
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                SEPOLIA
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '2px' }}>
              Ethereum Sepolia Testnet Explorer, Address Validator & Transaction Analytics
            </p>
          </div>
        </div>

        {/* Network Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenRpcConfig}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            title="Configure Sepolia RPC Endpoint"
          >
            RPC Config
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '9999px',
              background: networkInfo
                ? 'rgba(16, 185, 129, 0.08)'
                : connectionError
                ? 'rgba(244, 63, 94, 0.08)'
                : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${
                networkInfo
                  ? 'rgba(16, 185, 129, 0.3)'
                  : connectionError
                  ? 'rgba(244, 63, 94, 0.3)'
                  : 'rgba(245, 158, 11, 0.3)'
              }`
            }}
          >
            {isConnecting ? (
              <>
                <RefreshCw size={15} className="animate-spin" style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>
                  Connecting Sepolia...
                </span>
              </>
            ) : networkInfo ? (
              <>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                      Sepolia (11155111)
                    </span>
                    <ShieldCheck size={14} style={{ color: '#34d399' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Block #{networkInfo.currentBlock.toLocaleString()} • {networkInfo.latencyMs}ms
                  </span>
                </div>
              </>
            ) : (
              <>
                <WifiOff size={15} style={{ color: '#f43f5e' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f43f5e' }}>
                  RPC Disconnected
                </span>
              </>
            )}

            <button
              onClick={onRefreshNetwork}
              disabled={isConnecting}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                marginLeft: '4px'
              }}
              title="Refresh network connection"
            >
              <RefreshCw size={13} className={isConnecting ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
