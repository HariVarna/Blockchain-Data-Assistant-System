import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { MalformedRecordReport } from '../types/transaction';

interface MalformedRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: MalformedRecordReport[];
  sourceLabel: string;
}

export const MalformedRecordsModal: React.FC<MalformedRecordsModalProps> = ({
  isOpen,
  onClose,
  reports,
  sourceLabel
}) => {
  if (!isOpen || reports.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          background: '#0f172a'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              Dataset Malformed Rows Report ({reports.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
          The following records from <strong>{sourceLabel}</strong> failed validation and were excluded from analytics:
        </p>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reports.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                  Row #{item.rowNumber}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Validation Error</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#f8fafc', fontWeight: 500 }}>
                {item.reason}
              </p>
              {Boolean(item.raw) && (
                <div
                  style={{
                    fontSize: '0.725rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#64748b',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    overflowX: 'auto'
                  }}
                >
                  {typeof item.raw === 'string' ? item.raw : JSON.stringify(item.raw)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
