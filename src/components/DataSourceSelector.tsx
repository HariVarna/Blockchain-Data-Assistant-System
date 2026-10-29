import React, { useRef } from 'react';
import { Database, Globe, UploadCloud, Info, RefreshCw, FileText } from 'lucide-react';
import { DataSourceMode } from '../types/transaction';

interface DataSourceSelectorProps {
  mode: DataSourceMode;
  setMode: (mode: DataSourceMode) => void;
  onFetchActivity: () => void;
  isLoading: boolean;
  canFetch: boolean;
  activeSourceLabel: string;
  onUploadFile: (file: File) => void;
  onLoadBundledSample: () => void;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  mode,
  setMode,
  onFetchActivity,
  isLoading,
  canFetch,
  activeSourceLabel,
  onUploadFile,
  onLoadBundledSample
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      // reset input value so re-uploading same file works
      e.target.value = '';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Transaction Data Source
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Choose between live blockchain indexer API or local validated transaction dataset.
          </p>
        </div>

        {/* Fetch Activity Button */}
        <button
          id="fetch-activity-btn"
          className="btn btn-primary"
          onClick={onFetchActivity}
          disabled={!canFetch || isLoading}
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Fetching Activity...</span>
            </>
          ) : (
            <>
              <Database size={18} />
              <span>Fetch Activity</span>
            </>
          )}
        </button>
      </div>

      {/* Mode Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          marginBottom: '16px'
        }}
      >
        {/* Mode A: Explorer/Indexer API */}
        <div
          onClick={() => setMode('INDEXER')}
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: `2px solid ${mode === 'INDEXER' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
            background: mode === 'INDEXER' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.5)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} style={{ color: mode === 'INDEXER' ? '#38bdf8' : '#94a3b8' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: mode === 'INDEXER' ? '#f8fafc' : '#cbd5e1' }}>
                Mode A — Live Explorer / Indexer API
              </span>
            </div>
            {mode === 'INDEXER' && (
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#38bdf8', color: '#0f172a', fontWeight: 800 }}>
                ACTIVE
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Connects to Ethereum Sepolia indexer (Blockscout / Etherscan API) to retrieve live confirmed transactions.
          </p>
        </div>

        {/* Mode B: Supplied Dataset */}
        <div
          onClick={() => setMode('DATASET')}
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: `2px solid ${mode === 'DATASET' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'}`,
            background: mode === 'DATASET' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(15, 23, 42, 0.5)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: mode === 'DATASET' ? '#a78bfa' : '#94a3b8' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: mode === 'DATASET' ? '#f8fafc' : '#cbd5e1' }}>
                Mode B — Supplied / Uploaded Dataset
              </span>
            </div>
            {mode === 'DATASET' && (
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#8b5cf6', color: '#ffffff', fontWeight: 800 }}>
                ACTIVE
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Loads offline CSV / JSON transaction dataset with strict format validation, malformed row detection, and wallet filtering.
          </p>
        </div>
      </div>

      {/* Dataset Controls (Visible when Mode B is active) */}
      {mode === 'DATASET' && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>
              Dataset Source:
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c4b5fd',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}
            >
              {activeSourceLabel}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.json,application/json,text/csv"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <UploadCloud size={14} />
              <span>Upload CSV / JSON</span>
            </button>
            <button
              onClick={onLoadBundledSample}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              Reset to Bundled Demo
            </button>
          </div>
        </div>
      )}

      {/* Architectural Disclaimer / Examination Note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}
      >
        <Info size={16} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#e2e8f0' }}>Architecture Note:</strong> Standard Ethereum JSON-RPC nodes only support block-by-block queries and lack an arbitrary address-indexed transaction history method (`getTransactionsByAddress`). Complete wallet activity requires an explorer indexer API (Mode A) or indexed dataset records (Mode B).
        </div>
      </div>
    </div>
  );
};
