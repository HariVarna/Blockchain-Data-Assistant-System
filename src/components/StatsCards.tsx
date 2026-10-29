import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Repeat, Layers, Wallet } from 'lucide-react';
import { TransactionSummaryStats } from '../types/transaction';

interface StatsCardsProps {
  stats: TransactionSummaryStats | null;
  balanceEth: string | null;
  activeDataSource: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  balanceEth,
  activeDataSource
}) => {
  if (!stats) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}
    >
      {/* Total Transactions */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Total Transactions
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {stats.totalCount}
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
          Source: {activeDataSource.length > 28 ? activeDataSource.slice(0, 28) + '...' : activeDataSource}
        </div>
      </div>

      {/* Incoming Transactions */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase' }}>
              Incoming ({stats.incomingCount})
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              +{stats.totalReceivedEth} <span style={{ fontSize: '0.85rem' }}>ETH</span>
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
          Total received across transactions
        </div>
      </div>

      {/* Outgoing Transactions */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase' }}>
              Outgoing ({stats.outgoingCount})
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              -{stats.totalSentEth} <span style={{ fontSize: '0.85rem' }}>ETH</span>
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
          Total sent transfers
        </div>
      </div>

      {/* Self Transfers */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase' }}>
              Self Transfers
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#a78bfa', marginTop: '4px' }}>
              {stats.selfTransferCount}
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
          Zero net change • Single counted
        </div>
      </div>

      {/* Current Sepolia Balance */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
              Live Sepolia Balance
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
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
          Queried live from JSON-RPC node
        </div>
      </div>
    </div>
  );
};
