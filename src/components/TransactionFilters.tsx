import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { TransactionDirection } from '../types/transaction';

interface TransactionFiltersProps {
  selectedDirection: TransactionDirection | 'ALL';
  setSelectedDirection: (dir: TransactionDirection | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'NEWEST' | 'OLDEST' | 'VALUE_HIGH' | 'VALUE_LOW';
  setSortBy: (sort: 'NEWEST' | 'OLDEST' | 'VALUE_HIGH' | 'VALUE_LOW') => void;
  totalFiltered: number;
  totalAvailable: number;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  selectedDirection,
  setSelectedDirection,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  totalFiltered,
  totalAvailable
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '4px 0'
      }}
    >
      {/* Direction Pills and Count indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setSelectedDirection('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${selectedDirection === 'ALL' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
            background: selectedDirection === 'ALL' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: selectedDirection === 'ALL' ? '#38bdf8' : '#94a3b8',
            transition: 'all 0.15s ease'
          }}
        >
          All ({totalAvailable})
        </button>

        <button
          onClick={() => setSelectedDirection('INCOMING')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${selectedDirection === 'INCOMING' ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
            background: selectedDirection === 'INCOMING' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: selectedDirection === 'INCOMING' ? '#34d399' : '#94a3b8',
            transition: 'all 0.15s ease'
          }}
        >
          Incoming
        </button>

        <button
          onClick={() => setSelectedDirection('OUTGOING')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${selectedDirection === 'OUTGOING' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
            background: selectedDirection === 'OUTGOING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: selectedDirection === 'OUTGOING' ? '#fbbf24' : '#94a3b8',
            transition: 'all 0.15s ease'
          }}
        >
          Outgoing
        </button>

        <button
          onClick={() => setSelectedDirection('SELF_TRANSFER')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${selectedDirection === 'SELF_TRANSFER' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'}`,
            background: selectedDirection === 'SELF_TRANSFER' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: selectedDirection === 'SELF_TRANSFER' ? '#c4b5fd' : '#94a3b8',
            transition: 'all 0.15s ease'
          }}
        >
          Self-Transfer
        </button>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Showing {totalFiltered} of {totalAvailable}
        </span>
      </div>

      {/* Search and Sort controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search hash or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '8px 12px 8px 32px' }}
          />
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={14} style={{ color: '#94a3b8' }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="NEWEST">Newest Block First</option>
            <option value="OLDEST">Oldest Block First</option>
            <option value="VALUE_HIGH">Highest Value First</option>
            <option value="VALUE_LOW">Lowest Value First</option>
          </select>
        </div>
      </div>
    </div>
  );
};
