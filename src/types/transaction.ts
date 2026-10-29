/**
 * Transaction Activity Data Models & Types
 */

export type TransactionDirection = 'INCOMING' | 'OUTGOING' | 'SELF_TRANSFER' | 'UNKNOWN';

export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN';

export interface NormalizedTransaction {
  transactionHash: string;
  blockNumber: number;
  timestamp: number | null; // Unix timestamp in seconds
  from: string;
  to: string | null; // null for contract deployment / creation
  valueWei: string;
  valueEth: string;
  direction: TransactionDirection;
  status: TransactionStatus;
  dataSource: string;
  gasUsed?: string;
  gasPriceWei?: string;
  feeEth?: string;
  isContractCreation?: boolean;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  currentBlock: number;
  isSepolia: boolean;
  latencyMs: number;
  rpcUrl: string;
  connectedAt?: Date;
}

export interface WalletValidationResult {
  isValid: boolean;
  normalizedAddress: string | null;
  error: string | null;
}

export type DataSourceMode = 'INDEXER' | 'DATASET';

export interface MalformedRecordReport {
  rowNumber: number;
  reason: string;
  raw: unknown;
}

export interface DatasetParseResult {
  transactions: NormalizedTransaction[];
  malformedRecords: MalformedRecordReport[];
  totalParsed: number;
  sourceLabel: string;
}

export interface TransactionSummaryStats {
  totalCount: number;
  incomingCount: number;
  outgoingCount: number;
  selfTransferCount: number;
  totalReceivedEth: string;
  totalSentEth: string;
  netVolumeEth: string;
}
