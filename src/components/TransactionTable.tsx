import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileCode
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
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const formatShortAddress = (addr: string | null) => {
    if (!addr) return 'Contract Creation';
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimestamp = (ts: number | null) => {
    if (!ts) return '—';
    const date = new Date(ts * 1000);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDirectionBadge = (direction: TransactionDirection) => {
    switch (direction) {
      case 'INCOMING':
        return <span className="badge badge-incoming">In</span>;
      case 'OUTGOING':
        return <span className="badge badge-outgoing">Out</span>;
      case 'SELF_TRANSFER':
        return <span className="badge badge-self">Self</span>;
      default:
        return <span className="badge badge-unknown">—</span>;
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'SUCCESS') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#34d399', fontSize: '0.75rem' }}>
          <CheckCircle2 size={12} />
          Ok
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#f87171', fontSize: '0.75rem' }}>
          <XCircle size={12} />
          Failed
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#71717a', fontSize: '0.75rem' }}>
        <HelpCircle size={12} />
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div
        className="minimal-card"
        style={{
          padding: '48px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid #27272a',
            borderTopColor: '#fafafa'
          }}
          className="animate-spin"
        />
        <span style={{ color: '#71717a', fontSize: '0.78rem' }}>Loading activity...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        className="minimal-card"
        style={{
          padding: '48px 16px',
          textAlign: 'center',
          color: '#71717a',
          fontSize: '0.8125rem'
        }}
      >
        No transactions found
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table id="transactions-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Type</th>
            <th>Hash</th>
            <th>Block</th>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, idx) => {
            const isSenderQueried = queriedAddress && tx.from.toLowerCase() === queriedAddress.toLowerCase();
            const isRecipientQueried = queriedAddress && tx.to && tx.to.toLowerCase() === queriedAddress.toLowerCase();
            const rowKey = `${tx.transactionHash}-${idx}`;

            return (
              <tr key={rowKey}>
                <td>{renderStatusBadge(tx.status)}</td>
                <td>{renderDirectionBadge(tx.direction)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#fafafa',
                        textDecoration: 'none',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title={tx.transactionHash}
                    >
                      <span>{tx.transactionHash.slice(0, 8)}...{tx.transactionHash.slice(-6)}</span>
                      <ExternalLink size={10} style={{ color: '#71717a' }} />
                    </a>
                    <button
                      onClick={() => handleCopy(tx.transactionHash, tx.transactionHash)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#52525b',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '1px'
                      }}
                      title="Copy Hash"
                    >
                      {copiedHash === tx.transactionHash ? (
                        <Check size={11} style={{ color: '#34d399' }} />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </td>
                <td>
                  <a
                    href={`https://sepolia.etherscan.io/block/${tx.blockNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#a1a1aa',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem'
                    }}
                  >
                    #{tx.blockNumber}
                  </a>
                </td>
                <td style={{ color: '#a1a1aa', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {formatTimestamp(tx.timestamp)}
                </td>
                <td>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '0.78rem',
                      color: isSenderQueried ? '#38bdf8' : '#a1a1aa'
                    }}
                    title={tx.from}
                  >
                    {formatShortAddress(tx.from)}
                  </span>
                </td>
                <td>
                  {tx.isContractCreation || !tx.to ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#c084fc', fontSize: '0.75rem' }}>
                      <FileCode size={11} />
                      Contract
                    </span>
                  ) : (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.78rem',
                        color: isRecipientQueried ? '#38bdf8' : '#a1a1aa'
                      }}
                      title={tx.to}
                    >
                      {formatShortAddress(tx.to)}
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: tx.direction === 'INCOMING' ? '#34d399' : tx.direction === 'OUTGOING' ? '#fbbf24' : '#fafafa'
                    }}
                  >
                    {tx.valueEth} ETH
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
