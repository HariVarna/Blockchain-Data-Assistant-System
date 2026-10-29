import { TransactionDirection, NormalizedTransaction } from './transaction';

export interface TransactionFilterState {
  direction: TransactionDirection | 'ALL';
  minAmountEth: string;
  maxAmountEth: string;
  minBlock: string;
  maxBlock: string;
  searchQuery: string;
  userQueryText?: string;
}

export interface FilterValidationErrors {
  amountError: string | null;
  blockError: string | null;
}

export interface DetailedTransactionSummary {
  totalRetrieved: number;
  totalMatching: number;
  incomingCount: number;
  outgoingCount: number;
  selfTransferCount: number;
  unknownCount: number;
  totalReceivedEth: string; // Formatted string from exact integer Wei calculation
  totalSentEth: string;     // Formatted string from exact integer Wei calculation
  minBlock: number | null;
  maxBlock: number | null;
}

export interface PdfReportOptions {
  walletAddress: string;
  networkName: string;
  chainId: number;
  dataSource: string;
  dataRetrievalStatus: string;
  userQueryText: string;
  appliedFilters: TransactionFilterState;
  allTransactions: NormalizedTransaction[];
  matchingTransactions: NormalizedTransaction[];
  summary: DetailedTransactionSummary;
  datasetFilename?: string;
  isSuppliedDataset: boolean;
}
