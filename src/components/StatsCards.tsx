import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Repeat, Layers, Wallet, Hash } from 'lucide-react';
import { DetailedTransactionSummary } from '../types/filters';

interface StatsCardsProps {
  summary: DetailedTransactionSummary | null;
  balanceEth: string | null;
  activeDataSource: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  summary,
  balanceEth,
  activeDataSource
}) => {
  if (!summary) return null;

  const blockSpanText = summary.minBlock !== null && summary.maxBlock !== null
    ? `#${summary.minBlock.toLocaleString()} - #${summary.maxBlock.toLocaleString()}`
    : 'N/A';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}
    >
      {/* 1. Total Matching & Retrieved */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Filtered / Retrieved
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {summary.totalMatching}{' '}
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                / {summary.totalRetrieved}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8'
            }}
          >
            <Layers size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '8px' }}>
          Source: {activeDataSource.length > 24 ? activeDataSource.slice(0, 24) + '...' : activeDataSource}
        </div>
      </div>

      {/* 2. Incoming Transactions Volume */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase' }}>
              Incoming ({summary.incomingCount})
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              +{summary.totalReceivedEth} <span style={{ fontSize: '0.8rem' }}>ETH</span>
            </div>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981'
            }}
          >
            <ArrowDownLeft size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '8px' }}>
          Transaction value sum (not net balance)
        </div>
      </div>

      {/* 3. Outgoing Transactions Volume */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase' }}>
              Outgoing ({summary.outgoingCount})
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              -{summary.totalSentEth} <span style={{ fontSize: '0.8rem' }}>ETH</span>
            </div>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b'
            }}
          >
            <ArrowUpRight size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '8px' }}>
          Transaction value sum (not net loss)
        </div>
      </div>

      {/* 4. Self Transfers */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase' }}>
              Self-Transfers
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#a78bfa', marginTop: '4px' }}>
              {summary.selfTransferCount}
            </div>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6'
            }}
          >
            <Repeat size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '8px' }}>
          Single counted • Zero net volume impact
        </div>
      </div>

      {/* 5. Block Range Span */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase' }}>
              Matching Block Span
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              {blockSpanText}
            </div>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8'
            }}
          >
            <Hash size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '8px' }}>
          Inclusive block boundary span
        </div>
      </div>

      {/* 6. Current Sepolia Balance */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
              Live Sepolia Balance
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {balanceEth !== null ? `${balanceEth} ETH` : 'N/A'}
            </div>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8'
            }}
          >
            <Wallet size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '8px' }}>
          Live state query via JSON-RPC
        </div>
      </div>
    </div>
  );
};
