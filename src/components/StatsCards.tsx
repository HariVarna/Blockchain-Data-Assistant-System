import React from 'react';
import { DetailedTransactionSummary } from '../types/filters';

interface StatsCardsProps {
  summary: DetailedTransactionSummary | null;
  balanceEth: string | null;
  activeDataSource: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  summary,
  balanceEth
}) => {
  if (!summary) return null;

  const blockSpanText = summary.minBlock !== null && summary.maxBlock !== null
    ? `#${summary.minBlock.toLocaleString()} - #${summary.maxBlock.toLocaleString()}`
    : '—';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px'
      }}
    >
      {/* 1. Filtered / Retrieved */}
      <div className="minimal-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
          Records
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fafafa', marginTop: '2px' }}>
          {summary.totalMatching}
          <span style={{ fontSize: '0.78rem', color: '#71717a', fontWeight: 400, marginLeft: '4px' }}>
            / {summary.totalRetrieved}
          </span>
        </div>
      </div>

      {/* 2. Incoming */}
      <div className="minimal-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 500 }}>
          Incoming ({summary.incomingCount})
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fafafa', marginTop: '2px' }}>
          +{summary.totalReceivedEth}{' '}
          <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 400 }}>ETH</span>
        </div>
      </div>

      {/* 3. Outgoing */}
      <div className="minimal-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 500 }}>
          Outgoing ({summary.outgoingCount})
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fafafa', marginTop: '2px' }}>
          -{summary.totalSentEth}{' '}
          <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 400 }}>ETH</span>
        </div>
      </div>

      {/* 4. Self-Transfers */}
      <div className="minimal-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 500 }}>
          Self-Transfers
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fafafa', marginTop: '2px' }}>
          {summary.selfTransferCount}
        </div>
      </div>

      {/* 5. Block Span */}
      <div className="minimal-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
          Block Span
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#fafafa', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
          {blockSpanText}
        </div>
      </div>

      {/* 6. Live Balance */}
      <div className="minimal-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 500 }}>
          Sepolia Balance
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fafafa', marginTop: '2px' }}>
          {balanceEth !== null ? `${balanceEth}` : '—'}{' '}
          <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 400 }}>ETH</span>
        </div>
      </div>
    </div>
  );
};
