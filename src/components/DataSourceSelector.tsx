import React, { useRef } from 'react';
import { Database, UploadCloud, RefreshCw } from 'lucide-react';
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
      e.target.value = '';
    }
  };

  return (
    <div className="minimal-card" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        {/* Mode Segmented Switch */}
        <div
          style={{
            display: 'inline-flex',
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '6px',
            padding: '2px'
          }}
        >
          <button
            onClick={() => setMode('INDEXER')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 500,
              border: 'none',
              borderRadius: '4px',
              background: mode === 'INDEXER' ? '#27272a' : 'transparent',
              color: mode === 'INDEXER' ? '#fafafa' : '#71717a',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Live Indexer
          </button>
          <button
            onClick={() => setMode('DATASET')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 500,
              border: 'none',
              borderRadius: '4px',
              background: mode === 'DATASET' ? '#27272a' : 'transparent',
              color: mode === 'DATASET' ? '#fafafa' : '#71717a',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Supplied Dataset
          </button>
        </div>

        {/* Dataset Controls (if dataset mode active) */}
        {mode === 'DATASET' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.json,application/json,text/csv"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-outline"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            >
              <UploadCloud size={12} />
              <span>Import</span>
            </button>
            <button
              onClick={onLoadBundledSample}
              className="btn btn-outline"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            >
              Reset
            </button>
          </div>
        )}

        {/* Fetch Activity Button */}
        <button
          id="fetch-activity-btn"
          className="btn btn-primary"
          onClick={onFetchActivity}
          disabled={!canFetch || isLoading}
          style={{ padding: '7px 16px' }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <Database size={14} />
              <span>Fetch Activity</span>
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.72rem', color: '#71717a' }}>
        <span>Source: {activeSourceLabel}</span>
        <span>Standard JSON-RPC does not index arbitrary addresses</span>
      </div>
    </div>
  );
};
