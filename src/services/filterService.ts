import { parseEther, formatEther } from 'ethers';
import { NormalizedTransaction } from '../types/transaction';
import {
  TransactionFilterState,
  FilterValidationErrors,
  DetailedTransactionSummary
} from '../types/filters';

/**
 * Safely parses a human ETH input string into a precise integer BigInt Wei value.
 * Throws an Error if the input is malformed, negative, or not a valid number.
 */
export function parseEthInputToWei(ethStr: string): bigint {
  const trimmed = ethStr.trim();
  if (!trimmed) {
    throw new Error('Amount cannot be empty.');
  }

  if (trimmed.startsWith('-')) {
    throw new Error('ETH amount must be non-negative.');
  }

  // Reject invalid characters or multiple decimals
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid ETH number format: "${trimmed}". Must be a positive numeric value.`);
  }

  const numVal = parseFloat(trimmed);
  if (!isFinite(numVal) || isNaN(numVal)) {
    throw new Error(`Amount is not a finite number: "${trimmed}".`);
  }

  if (numVal < 0) {
    throw new Error('ETH amount must be non-negative.');
  }

  try {
    return parseEther(trimmed);
  } catch (err: unknown) {
    throw new Error(`Failed to parse ETH amount "${trimmed}": ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Validates the filter state inputs for both Amount and Block ranges.
 * Ensures boundaries are finite, non-negative, and properly ordered.
 */
export function validateFilterInputs(filters: TransactionFilterState): {
  isValid: boolean;
  errors: FilterValidationErrors;
} {
  const errors: FilterValidationErrors = {
    amountError: null,
    blockError: null
  };

  // 1. Amount Range Validation
  let parsedMinWei: bigint | null = null;
  let parsedMaxWei: bigint | null = null;

  if (filters.minAmountEth.trim()) {
    try {
      parsedMinWei = parseEthInputToWei(filters.minAmountEth);
    } catch (err) {
      errors.amountError = err instanceof Error ? err.message : 'Invalid minimum ETH amount.';
    }
  }

  if (filters.maxAmountEth.trim()) {
    try {
      parsedMaxWei = parseEthInputToWei(filters.maxAmountEth);
    } catch (err) {
      errors.amountError = err instanceof Error ? err.message : 'Invalid maximum ETH amount.';
    }
  }

  if (!errors.amountError && parsedMinWei !== null && parsedMaxWei !== null) {
    if (parsedMinWei > parsedMaxWei) {
      errors.amountError = 'Minimum ETH amount cannot exceed maximum amount.';
    }
  }

  // 2. Block Range Validation
  let parsedMinBlock: number | null = null;
  let parsedMaxBlock: number | null = null;

  if (filters.minBlock.trim()) {
    const minStr = filters.minBlock.trim();
    if (!/^\d+$/.test(minStr)) {
      errors.blockError = 'Minimum block must be a non-negative integer.';
    } else {
      parsedMinBlock = parseInt(minStr, 10);
    }
  }

  if (filters.maxBlock.trim()) {
    const maxStr = filters.maxBlock.trim();
    if (!/^\d+$/.test(maxStr)) {
      errors.blockError = 'Maximum block must be a non-negative integer.';
    } else {
      parsedMaxBlock = parseInt(maxStr, 10);
    }
  }

  if (!errors.blockError && parsedMinBlock !== null && parsedMaxBlock !== null) {
    if (parsedMinBlock > parsedMaxBlock) {
      errors.blockError = 'Minimum block cannot exceed maximum block.';
    }
  }

  const isValid = !errors.amountError && !errors.blockError;
  return { isValid, errors };
}

/**
 * Deterministically sorts transactions by block number descending,
 * then by transaction hash ascending.
 */
export function sortTransactionsDeterministically(
  transactions: NormalizedTransaction[]
): NormalizedTransaction[] {
  return [...transactions].sort((a, b) => {
    if (b.blockNumber !== a.blockNumber) {
      return b.blockNumber - a.blockNumber;
    }
    return a.transactionHash.localeCompare(b.transactionHash);
  });
}

/**
 * Applies all filter criteria simultaneously to a transaction collection without mutating it.
 * Uses exact BigInt integer comparisons for Wei amounts.
 * Inclusive boundaries are applied consistently for both amount and block ranges.
 */
export function applyTransactionFilters(
  transactions: NormalizedTransaction[],
  filters: TransactionFilterState
): NormalizedTransaction[] {
  // Pre-parse amount boundaries if valid
  let minWei: bigint | null = null;
  let maxWei: bigint | null = null;

  try {
    if (filters.minAmountEth.trim()) {
      minWei = parseEthInputToWei(filters.minAmountEth);
    }
    if (filters.maxAmountEth.trim()) {
      maxWei = parseEthInputToWei(filters.maxAmountEth);
    }
  } catch {
    // If invalid inputs are passed, return empty to prevent incorrect matches
    return [];
  }

  // Pre-parse block boundaries
  const minBlock = filters.minBlock.trim() ? parseInt(filters.minBlock.trim(), 10) : null;
  const maxBlock = filters.maxBlock.trim() ? parseInt(filters.maxBlock.trim(), 10) : null;
  const searchLower = filters.searchQuery.trim().toLowerCase();

  const filtered = transactions.filter((tx) => {
    // A. Direction Filter
    if (filters.direction !== 'ALL') {
      if (tx.direction === 'UNKNOWN') {
        return false; // Exclude UNKNOWN when directional filter is active
      }
      if (tx.direction !== filters.direction) {
        return false;
      }
    }

    // B. Amount Filter (Inclusive, using exact integer Wei)
    if (minWei !== null || maxWei !== null) {
      let txWei = 0n;
      try {
        txWei = BigInt(tx.valueWei || '0');
      } catch {
        txWei = 0n;
      }

      if (minWei !== null && txWei < minWei) {
        return false;
      }
      if (maxWei !== null && txWei > maxWei) {
        return false;
      }
    }

    // C. Block Range Filter (Inclusive)
    if (minBlock !== null || maxBlock !== null) {
      const txBlock = Number(tx.blockNumber);
      if (isNaN(txBlock) || txBlock <= 0) {
        return false;
      }
      if (minBlock !== null && txBlock < minBlock) {
        return false;
      }
      if (maxBlock !== null && txBlock > maxBlock) {
        return false;
      }
    }

    // D. Text Search Filter (Hash, From, To)
    if (searchLower) {
      const matchHash = tx.transactionHash.toLowerCase().includes(searchLower);
      const matchFrom = tx.from.toLowerCase().includes(searchLower);
      const matchTo = tx.to ? tx.to.toLowerCase().includes(searchLower) : false;
      if (!matchHash && !matchFrom && !matchTo) {
        return false;
      }
    }

    return true;
  });

  return sortTransactionsDeterministically(filtered);
}

/**
 * Calculates detailed summary statistics for matching transactions.
 * Uses exact BigInt integer addition for Wei sums and avoids double-counting self transfers.
 */
export function calculateDetailedSummary(
  matchingTransactions: NormalizedTransaction[],
  totalRetrieved: number
): DetailedTransactionSummary {
  let incomingCount = 0;
  let outgoingCount = 0;
  let selfTransferCount = 0;
  let unknownCount = 0;

  let totalReceivedWei = 0n;
  let totalSentWei = 0n;

  let minBlock: number | null = null;
  let maxBlock: number | null = null;

  for (const tx of matchingTransactions) {
    let txWei = 0n;
    try {
      txWei = BigInt(tx.valueWei || '0');
    } catch {
      txWei = 0n;
    }

    // Direction aggregation
    if (tx.direction === 'INCOMING') {
      incomingCount++;
      totalReceivedWei += txWei;
    } else if (tx.direction === 'OUTGOING') {
      outgoingCount++;
      totalSentWei += txWei;
    } else if (tx.direction === 'SELF_TRANSFER') {
      selfTransferCount++;
      // Self transfers do NOT inflate incoming or outgoing sums
    } else {
      unknownCount++;
    }

    // Block range bounds
    const blk = Number(tx.blockNumber);
    if (!isNaN(blk) && blk > 0) {
      if (minBlock === null || blk < minBlock) minBlock = blk;
      if (maxBlock === null || blk > maxBlock) maxBlock = blk;
    }
  }

  return {
    totalRetrieved,
    totalMatching: matchingTransactions.length,
    incomingCount,
    outgoingCount,
    selfTransferCount,
    unknownCount,
    totalReceivedEth: formatEther(totalReceivedWei),
    totalSentEth: formatEther(totalSentWei),
    minBlock,
    maxBlock
  };
}
