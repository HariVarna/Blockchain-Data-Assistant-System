import React from 'react';
import {
  Filter,
  RotateCcw,
  Trash2,
  FileDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { TransactionFilterState, FilterValidationErrors } from '../types/filters';

interface FilterControlsProps {
  filters: TransactionFilterState;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilterState>>;
  filterErrors: FilterValidationErrors;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onClearResults: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  canExportPdf: boolean;
  totalMatching: number;
  totalRetrieved: number;
  pdfExportSuccess: boolean;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  setFilters,
  filterErrors,
  onApplyFilters,
  onResetFilters,
  onClearResults,
  onExportPdf,
  isExportingPdf,
  canExportPdf,
  totalMatching,
  totalRetrieved,
  pdfExportSuccess
}) => {
  const handleChange = (field: keyof TransactionFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8'
            }}
          >
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Transaction Filters & Activity Audit
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Refine transactions by direction, precise ETH amount, block range, and query intent.
            </p>
          </div>
        </div>

        {/* Action Buttons: Apply, Reset, Clear, Export PDF */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            id="apply-filters-btn"
            onClick={onApplyFilters}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.825rem' }}
          >
            <Filter size={14} />
            <span>Apply Filters</span>
          </button>

          <button
            id="reset-filters-btn"
            onClick={onResetFilters}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            title="Reset all filters to default"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>

          <button
            id="clear-results-btn"
            onClick={onClearResults}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.825rem', color: '#f43f5e' }}
            title="Clear all retrieved transactions"
          >
            <Trash2 size={14} />
            <span>Clear Results</span>
          </button>

          <button
            id="export-pdf-btn"
            onClick={onExportPdf}
            disabled={!canExportPdf || isExportingPdf}
            className="btn btn-outline"
            style={{
              padding: '8px 16px',
              fontSize: '0.825rem',
              borderColor: '#38bdf8',
              color: '#38bdf8'
            }}
            title="Export comprehensive PDF report"
          >
            <FileDown size={14} />
            <span>{isExportingPdf ? 'Generating PDF...' : 'Export PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Query Text Field */}
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="user-query-input"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}
        >
          <FileText size={14} style={{ color: '#38bdf8' }} />
          <span>Audit Query Intent / Purpose (Preserved in Report):</span>
        </label>
        <input
          id="user-query-input"
          type="text"
          className="input-field"
          placeholder="e.g., Audit Sepolia testnet faucet distributions and outgoing smart contract deployments"
          value={filters.userQueryText || ''}
          onChange={(e) => handleChange('userQueryText' as any, e.target.value)}
          style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', padding: '10px 14px' }}
        />
      </div>

      {/* Structured Filter Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '14px'
        }}
      >
        {/* Direction Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Direction:
          </label>
          <select
            id="filter-direction-select"
            value={filters.direction}
            onChange={(e) => handleChange('direction', e.target.value as any)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Transactions</option>
            <option value="INCOMING">Incoming Only</option>
            <option value="OUTGOING">Outgoing Only</option>
            <option value="SELF_TRANSFER">Self-Transfers Only</option>
          </select>
        </div>

        {/* Amount: Min ETH */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Min ETH Amount (Inclusive):
          </label>
          <input
            id="filter-min-eth-input"
            type="text"
            className="input-field"
            placeholder="0.0"
            value={filters.minAmountEth}
            onChange={(e) => handleChange('minAmountEth', e.target.value)}
            style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          />
        </div>

        {/* Amount: Max ETH */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Max ETH Amount (Inclusive):
          </label>
          <input
            id="filter-max-eth-input"
            type="text"
            className="input-field"
            placeholder="e.g. 5.0"
            value={filters.maxAmountEth}
            onChange={(e) => handleChange('maxAmountEth', e.target.value)}
            style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          />
        </div>

        {/* Block: Min Block */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Min Block Number:
          </label>
          <input
            id="filter-min-block-input"
            type="text"
            className="input-field"
            placeholder="e.g. 6800000"
            value={filters.minBlock}
            onChange={(e) => handleChange('minBlock', e.target.value)}
            style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          />
        </div>

        {/* Block: Max Block */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Max Block Number:
          </label>
          <input
            id="filter-max-block-input"
            type="text"
            className="input-field"
            placeholder="e.g. 6850000"
            value={filters.maxBlock}
            onChange={(e) => handleChange('maxBlock', e.target.value)}
            style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          />
        </div>
      </div>

      {/* Validation Errors Feedback */}
      {(filterErrors.amountError || filterErrors.blockError) && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginBottom: '12px'
          }}
        >
          {filterErrors.amountError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{filterErrors.amountError}</span>
            </div>
          )}
          {filterErrors.blockError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{filterErrors.blockError}</span>
            </div>
          )}
        </div>
      )}

      {/* PDF Export Success Notification */}
      {pdfExportSuccess && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>PDF Report successfully generated and downloaded!</span>
        </div>
      )}

      {/* Filter Counts Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}
      >
        <div>
          Showing <strong style={{ color: '#38bdf8' }}>{totalMatching}</strong> matching records out of{' '}
          <strong style={{ color: '#f8fafc' }}>{totalRetrieved}</strong> total retrieved
        </div>

        {totalRetrieved > 0 && totalMatching === 0 && (
          <div style={{ color: '#fbbf24', fontWeight: 500 }}>
            No records match the active filter criteria. Try expanding the range or clicking Reset Filters.
          </div>
        )}
      </div>
    </div>
  );
};
