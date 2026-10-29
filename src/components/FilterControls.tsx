import React from 'react';
import {
  Filter,
  RotateCcw,
  Trash2,
  FileDown,
  CheckCircle2,
  AlertCircle
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
    <div className="minimal-card" style={{ padding: '16px 18px' }}>
      {/* Top Header & Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px'
        }}
      >
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fafafa' }}>
          Filters
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            id="apply-filters-btn"
            onClick={onApplyFilters}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Filter size={12} />
            <span>Apply</span>
          </button>

          <button
            id="reset-filters-btn"
            onClick={onResetFilters}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            title="Reset filters"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          <button
            id="clear-results-btn"
            onClick={onClearResults}
            className="btn btn-danger"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            title="Clear results"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>

          <button
            id="export-pdf-btn"
            onClick={onExportPdf}
            disabled={!canExportPdf || isExportingPdf}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            title="Download PDF report"
          >
            <FileDown size={12} />
            <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Query Intent */}
      <div style={{ marginBottom: '10px' }}>
        <input
          id="user-query-input"
          type="text"
          className="input-field"
          placeholder="Audit query intent (included in report)..."
          value={filters.userQueryText || ''}
          onChange={(e) => handleChange('userQueryText' as any, e.target.value)}
          style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', padding: '6px 10px' }}
        />
      </div>

      {/* Filter Inputs Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          marginBottom: '10px'
        }}
      >
        <div>
          <select
            id="filter-direction-select"
            value={filters.direction}
            onChange={(e) => handleChange('direction', e.target.value as any)}
            className="input-field"
            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
          >
            <option value="ALL">All Directions</option>
            <option value="INCOMING">Incoming</option>
            <option value="OUTGOING">Outgoing</option>
            <option value="SELF_TRANSFER">Self-Transfer</option>
          </select>
        </div>

        <div>
          <input
            id="filter-min-eth-input"
            type="text"
            className="input-field"
            placeholder="Min ETH"
            value={filters.minAmountEth}
            onChange={(e) => handleChange('minAmountEth', e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
          />
        </div>

        <div>
          <input
            id="filter-max-eth-input"
            type="text"
            className="input-field"
            placeholder="Max ETH"
            value={filters.maxAmountEth}
            onChange={(e) => handleChange('maxAmountEth', e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
          />
        </div>

        <div>
          <input
            id="filter-min-block-input"
            type="text"
            className="input-field"
            placeholder="Min Block"
            value={filters.minBlock}
            onChange={(e) => handleChange('minBlock', e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
          />
        </div>

        <div>
          <input
            id="filter-max-block-input"
            type="text"
            className="input-field"
            placeholder="Max Block"
            value={filters.maxBlock}
            onChange={(e) => handleChange('maxBlock', e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* Validation Errors Feedback */}
      {(filterErrors.amountError || filterErrors.blockError) && (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'rgba(248, 113, 113, 0.08)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            color: '#f87171',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            marginBottom: '8px'
          }}
        >
          {filterErrors.amountError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={12} style={{ flexShrink: 0 }} />
              <span>{filterErrors.amountError}</span>
            </div>
          )}
          {filterErrors.blockError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={12} style={{ flexShrink: 0 }} />
              <span>{filterErrors.blockError}</span>
            </div>
          )}
        </div>
      )}

      {/* PDF Export Success */}
      {pdfExportSuccess && (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            color: '#34d399',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px'
          }}
        >
          <CheckCircle2 size={13} />
          <span>Report downloaded</span>
        </div>
      )}

      {/* Counts Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: '#71717a'
        }}
      >
        <span>
          Showing <span style={{ color: '#fafafa', fontWeight: 500 }}>{totalMatching}</span> of {totalRetrieved} records
        </span>

        {totalRetrieved > 0 && totalMatching === 0 && (
          <span style={{ color: '#fbbf24' }}>
            No matching records
          </span>
        )}
      </div>
    </div>
  );
};
