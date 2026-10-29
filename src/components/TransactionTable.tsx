import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileCode,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Inbox
} from 'lucide-react';
import { NormalizedTransaction, TransactionDirection } from '../types/transaction';

interface TransactionTableProps {
  transactions: NormalizedTransaction[];
  isLoading: boolean;
  queriedAddress: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading,
  queriedAddress
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatShortAddress = (addr: string | null) => {
    if (!addr) return 'None (Contract Creation)';
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimestamp = (ts: number | null) => {
    if (!ts) return 'Unknown';
    const date = new Date(ts * 1000);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDirectionBadge = (direction: TransactionDirection) => {
    switch (direction) {
      case 'INCOMING':
        return (
          <span className="badge badge-incoming">
            <ArrowDownLeft size={12} />
            Incoming
          </span>
        );
      case 'OUTGOING':
        return (
          <span className="badge badge-outgoing">
            <ArrowUpRight size={12} />
            Outgoing
          </span>
        );
      case 'SELF_TRANSFER':
        return (
          <span className="badge badge-self">
            <Repeat size={12} />
            Self-Transfer
          </span>
        );
      default:
        return (
          <span className="badge badge-unknown">
            Unknown
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'SUCCESS') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
          <CheckCircle2 size={15} />
          Success
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.8rem', fontWeight: 600 }}>
          <XCircle size={15} />
          Failed
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.8rem' }}>
        <HelpCircle size={15} />
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(56, 189, 248, 0.2)',
            borderTopColor: '#38bdf8'
          }}
          className="animate-spin"
        />
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Querying Sepolia blockchain activity and normalizing records...
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}
        >
          <Inbox size={28} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
          No Transactions Found
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '440px' }}>
          No transaction activity matching the queried address and filters was found on Ethereum Sepolia or within the loaded dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="table-wrapper">
        <table id="transactions-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Direction</th>
              <th>Transaction Hash</th>
              <th>Block</th>
              <th>Timestamp</th>
              <th>Sender (From)</th>
              <th>Recipient (To)</th>
              <th style={{ textAlign: 'right' }}>Value (ETH)</th>
              <th>Data Source</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => {
              const isSenderQueried = queriedAddress && tx.from.toLowerCase() === queriedAddress.toLowerCase();
              const isRecipientQueried = queriedAddress && tx.to && tx.to.toLowerCase() === queriedAddress.toLowerCase();
              const rowKey = `${tx.transactionHash}-${idx}`;

              return (
                <tr key={rowKey}>
                  {/* Status */}
                  <td>{renderStatusBadge(tx.status)}</td>

                  {/* Direction */}
                  <td>{renderDirectionBadge(tx.direction)}</td>

                  {/* Transaction Hash with link & copy */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.825rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={`View tx on Sepolia Etherscan: ${tx.transactionHash}`}
                      >
                        <span>{tx.transactionHash.slice(0, 8)}...{tx.transactionHash.slice(-6)}</span>
                        <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => handleCopy(tx.transactionHash, tx.transactionHash)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px'
                        }}
                        title="Copy Transaction Hash"
                      >
                        {copiedHash === tx.transactionHash ? (
                          <Check size={13} style={{ color: '#10b981' }} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Block Number */}
                  <td>
                    <a
                      href={`https://sepolia.etherscan.io/block/${tx.blockNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#94a3b8',
                        textDecoration: 'none',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.825rem'
                      }}
                      title={`View Block #${tx.blockNumber}`}
                    >
                      #{tx.blockNumber}
                    </a>
                  </td>

                  {/* Timestamp */}
                  <td style={{ color: '#cbd5e1', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {formatTimestamp(tx.timestamp)}
                  </td>

                  {/* From Address */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '0.8rem',
                          color: isSenderQueried ? '#38bdf8' : '#e2e8f0',
                          fontWeight: isSenderQueried ? 700 : 400,
                          background: isSenderQueried ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                          padding: isSenderQueried ? '2px 6px' : '0',
                          borderRadius: '4px'
                        }}
                        title={tx.from}
                      >
                        {formatShortAddress(tx.from)}
                      </span>
                      <button
                        onClick={() => handleCopy(tx.from, `from-${rowKey}`)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '1px' }}
                        title="Copy Sender Address"
                      >
                        {copiedHash === `from-${rowKey}` ? (
                          <Check size={12} style={{ color: '#10b981' }} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* To Address / Contract Creation */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tx.isContractCreation || !tx.to ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#a78bfa',
                            fontSize: '0.78rem',
                            fontStyle: 'italic'
                          }}
                        >
                          <FileCode size={13} />
                          Contract Creation
                        </span>
                      ) : (
                        <>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '0.8rem',
                              color: isRecipientQueried ? '#38bdf8' : '#e2e8f0',
                              fontWeight: isRecipientQueried ? 700 : 400,
                              background: isRecipientQueried ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                              padding: isRecipientQueried ? '2px 6px' : '0',
                              borderRadius: '4px'
                            }}
                            title={tx.to}
                          >
                            {formatShortAddress(tx.to)}
                          </span>
                          <button
                            onClick={() => tx.to && handleCopy(tx.to, `to-${rowKey}`)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '1px' }}
                            title="Copy Recipient Address"
                          >
                            {copiedHash === `to-${rowKey}` ? (
                              <Check size={12} style={{ color: '#10b981' }} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Value ETH */}
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: tx.direction === 'INCOMING' ? '#34d399' : tx.direction === 'OUTGOING' ? '#fbbf24' : '#f8fafc'
                        }}
                      >
                        {tx.valueEth} ETH
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }} title={`${tx.valueWei} Wei`}>
                        {tx.valueWei === '0' ? '0 Wei' : `${tx.valueWei.slice(0, 4)}... Wei`}
                      </span>
                    </div>
                  </td>

                  {/* Data Source */}
                  <td>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      {tx.dataSource}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
