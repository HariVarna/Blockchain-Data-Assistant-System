import React from 'react';
import { Activity, WifiOff, RefreshCw, Settings2 } from 'lucide-react';
import { NetworkInfo } from '../types/transaction';

interface HeaderProps {
  networkInfo: NetworkInfo | null;
  isConnecting: boolean;
  connectionError?: string | null;
  onRefreshNetwork: () => void;
  onOpenRpcConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  networkInfo,
  isConnecting,
  onRefreshNetwork,
  onOpenRpcConfig
}) => {
  return (
    <header className="minimal-card" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} style={{ color: '#fafafa' }} />
          <h1 style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.01em', color: '#fafafa' }}>
            Wallet Activity Assistant
          </h1>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 500,
              padding: '1px 6px',
              borderRadius: '4px',
              background: '#18181b',
              color: '#a1a1aa',
              border: '1px solid #27272a'
            }}
          >
            Sepolia
          </span>
        </div>

        {/* Network & RPC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#121215',
              border: '1px solid #27272a',
              fontSize: '0.78rem'
            }}
          >
            {isConnecting ? (
              <>
                <RefreshCw size={12} className="animate-spin" style={{ color: '#fbbf24' }} />
                <span style={{ color: '#a1a1aa' }}>Connecting...</span>
              </>
            ) : networkInfo ? (
              <>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#34d399',
                    display: 'inline-block'
                  }}
                />
                <span style={{ color: '#fafafa', fontWeight: 500 }}>
                  11155111
                </span>
                <span style={{ color: '#71717a' }}>•</span>
                <span style={{ color: '#a1a1aa', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  #{networkInfo.currentBlock.toLocaleString()}
                </span>
                <span style={{ color: '#71717a' }}>•</span>
                <span style={{ color: '#71717a', fontSize: '0.72rem' }}>
                  {networkInfo.latencyMs}ms
                </span>
              </>
            ) : (
              <>
                <WifiOff size={12} style={{ color: '#f87171' }} />
                <span style={{ color: '#f87171', fontWeight: 500 }}>Offline</span>
              </>
            )}

            <button
              onClick={onRefreshNetwork}
              disabled={isConnecting}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2px'
              }}
              title="Refresh connection"
            >
              <RefreshCw size={11} className={isConnecting ? 'animate-spin' : ''} />
            </button>
          </div>

          <button
            onClick={onOpenRpcConfig}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            title="Configure RPC"
          >
            <Settings2 size={13} />
            <span>RPC</span>
          </button>
        </div>
      </div>
    </header>
  );
};
