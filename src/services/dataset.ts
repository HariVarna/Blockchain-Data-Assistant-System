import { isAddress, getAddress } from 'ethers';
import {
  DatasetParseResult,
  MalformedRecordReport,
  NormalizedTransaction,
  TransactionSummaryStats
} from '../types/transaction';
import { normalizeDatasetRecord } from './normalizer';
import sampleTransactionsData from '../sample-data/sampleTransactions.json';

/**
 * Validates whether a transaction hash has the expected 32-byte hex format (0x + 64 hex characters).
 */
export function isValidTransactionHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  const trimmed = hash.trim();
  return /^0x[0-9a-fA-F]{64}$/.test(trimmed);
}

/**
 * Simple, robust CSV line splitter that respects quoted fields containing commas.
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Validates and parses raw CSV string into normalized transactions and malformed records.
 */
export function parseCsvDataset(csvContent: string, sourceLabel = 'Imported CSV Dataset'): DatasetParseResult {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const malformedRecords: MalformedRecordReport[] = [];
  const transactions: NormalizedTransaction[] = [];

  if (lines.length === 0) {
    return {
      transactions: [],
      malformedRecords: [{ rowNumber: 0, reason: 'Dataset file is empty.', raw: '' }],
      totalParsed: 0,
      sourceLabel
    };
  }

  const rawHeader = splitCsvLine(lines[0]);
  const headerMap: Record<string, number> = {};
  rawHeader.forEach((col, idx) => {
    const cleanKey = col.replace(/['"]+/g, '').trim().toLowerCase();
    headerMap[cleanKey] = idx;
  });

  const getColValue = (row: string[], ...possibleKeys: string[]): string | undefined => {
    for (const key of possibleKeys) {
      const idx = headerMap[key.toLowerCase()];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx].replace(/^["']|["']$/g, '').trim();
      }
    }
    return undefined;
  };

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1; // 1-based index including header
    const rawLine = lines[i];
    const columns = splitCsvLine(rawLine);

    if (columns.length === 0 || (columns.length === 1 && columns[0] === '')) {
      continue;
    }

    const hash = getColValue(columns, 'transactionhash', 'hash', 'txhash', 'tx_hash');
    const from = getColValue(columns, 'from', 'sender', 'fromaddress', 'from_address');
    const to = getColValue(columns, 'to', 'recipient', 'toaddress', 'to_address');
    const valueWei = getColValue(columns, 'valuewei', 'value_wei', 'value', 'amount');
    const valueEth = getColValue(columns, 'valueeth', 'value_eth', 'eth');
    const block = getColValue(columns, 'blocknumber', 'block_number', 'block');
    const timestamp = getColValue(columns, 'timestamp', 'date', 'datetime', 'time');
    const status = getColValue(columns, 'status');
    const gasUsed = getColValue(columns, 'gasused', 'gas_used');
    const gasPrice = getColValue(columns, 'gasprice', 'gas_price');

    // Validation checks
    if (!hash) {
      malformedRecords.push({ rowNumber, reason: 'Missing required field: transactionHash', raw: rawLine });
      continue;
    }
    if (!isValidTransactionHash(hash)) {
      malformedRecords.push({ rowNumber, reason: `Invalid transactionHash format (must be 66-char hex): "${hash}"`, raw: rawLine });
      continue;
    }
    if (!from) {
      malformedRecords.push({ rowNumber, reason: 'Missing required field: from', raw: rawLine });
      continue;
    }
    if (!isAddress(from)) {
      malformedRecords.push({ rowNumber, reason: `Invalid "from" Ethereum address: "${from}"`, raw: rawLine });
      continue;
    }
    if (to && to !== '' && !isAddress(to)) {
      malformedRecords.push({ rowNumber, reason: `Invalid "to" Ethereum address: "${to}"`, raw: rawLine });
      continue;
    }

    const rawRecord: Record<string, unknown> = {
      transactionHash: hash,
      from,
      to: to || null,
      valueWei,
      valueEth,
      blockNumber: block ? Number(block) : undefined,
      timestamp,
      status: status || 'SUCCESS',
      gasUsed,
      gasPrice
    };

    const normalized = normalizeDatasetRecord(rawRecord, from, sourceLabel);
    transactions.push(normalized);
  }

  return {
    transactions,
    malformedRecords,
    totalParsed: transactions.length + malformedRecords.length,
    sourceLabel
  };
}

/**
 * Validates and parses a JSON dataset string or object.
 */
export function parseJsonDataset(
  jsonInput: string | unknown[],
  sourceLabel = 'Imported JSON Dataset'
): DatasetParseResult {
  let parsedArray: unknown[];
  const malformedRecords: MalformedRecordReport[] = [];
  const transactions: NormalizedTransaction[] = [];

  try {
    if (typeof jsonInput === 'string') {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        return {
          transactions: [],
          malformedRecords: [{ rowNumber: 1, reason: 'JSON root must be an array of transaction objects.', raw: jsonInput }],
          totalParsed: 0,
          sourceLabel
        };
      }
      parsedArray = parsed;
    } else if (Array.isArray(jsonInput)) {
      parsedArray = jsonInput;
    } else {
      return {
        transactions: [],
        malformedRecords: [{ rowNumber: 1, reason: 'Input must be a JSON array.', raw: jsonInput }],
        totalParsed: 0,
        sourceLabel
      };
    }
  } catch (err: unknown) {
    return {
      transactions: [],
      malformedRecords: [{
        rowNumber: 1,
        reason: `JSON parse syntax error: ${err instanceof Error ? err.message : String(err)}`,
        raw: typeof jsonInput === 'string' ? jsonInput.slice(0, 100) : ''
      }],
      totalParsed: 0,
      sourceLabel
    };
  }

  parsedArray.forEach((item, index) => {
    const rowNumber = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      malformedRecords.push({ rowNumber, reason: 'Record is not an object.', raw: item });
      return;
    }

    const raw = item as Record<string, unknown>;
    const hash = String(raw.transactionHash || raw.hash || raw.txHash || '').trim();
    const from = String(raw.from || raw.sender || '').trim();
    const to = raw.to !== undefined && raw.to !== null ? String(raw.to).trim() : null;

    if (!hash) {
      malformedRecords.push({ rowNumber, reason: 'Missing transactionHash', raw });
      return;
    }
    if (!isValidTransactionHash(hash)) {
      malformedRecords.push({ rowNumber, reason: `Invalid transactionHash format: "${hash}"`, raw });
      return;
    }
    if (!from) {
      malformedRecords.push({ rowNumber, reason: 'Missing "from" address', raw });
      return;
    }
    if (!isAddress(from)) {
      malformedRecords.push({ rowNumber, reason: `Invalid "from" Ethereum address: "${from}"`, raw });
      return;
    }
    if (to && to !== '' && !isAddress(to)) {
      malformedRecords.push({ rowNumber, reason: `Invalid "to" Ethereum address: "${to}"`, raw });
      return;
    }

    const normalized = normalizeDatasetRecord(raw, from, sourceLabel);
    transactions.push(normalized);
  });

  return {
    transactions,
    malformedRecords,
    totalParsed: transactions.length + malformedRecords.length,
    sourceLabel
  };
}

/**
 * Returns the bundled demonstration dataset.
 */
export function getBundledSampleDataset(): DatasetParseResult {
  return parseJsonDataset(sampleTransactionsData, 'Sample Dataset (Bundled Demo)');
}

/**
 * Filters dataset transactions by a specific wallet address and updates direction classification
 * relative to the queried wallet.
 * 
 * Accurately prevents double-counting self-transfers!
 */
export function filterDatasetByAddress(
  datasetTransactions: NormalizedTransaction[],
  targetAddress: string
): NormalizedTransaction[] {
  if (!isAddress(targetAddress)) return [];

  const normalizedTarget = getAddress(targetAddress.trim());

  return datasetTransactions
    .filter(tx => {
      const senderMatches = isAddress(tx.from) && getAddress(tx.from) === normalizedTarget;
      const recipientMatches = tx.to && isAddress(tx.to) && getAddress(tx.to) === normalizedTarget;
      return senderMatches || recipientMatches;
    })
    .map(tx => {
      // Re-classify direction strictly relative to targetAddress
      const senderMatches = isAddress(tx.from) && getAddress(tx.from) === normalizedTarget;
      const recipientMatches = tx.to && isAddress(tx.to) && getAddress(tx.to) === normalizedTarget;

      let direction = tx.direction;
      if (senderMatches && recipientMatches) {
        direction = 'SELF_TRANSFER';
      } else if (senderMatches) {
        direction = 'OUTGOING';
      } else if (recipientMatches) {
        direction = 'INCOMING';
      }

      return {
        ...tx,
        direction
      };
    });
}

/**
 * Computes summary statistics over a collection of transactions.
 * Carefully avoids double counting self transfers!
 */
export function calculateTransactionSummary(
  transactions: NormalizedTransaction[]
): TransactionSummaryStats {
  let incomingCount = 0;
  let outgoingCount = 0;
  let selfTransferCount = 0;
  let totalReceivedWei = 0n;
  let totalSentWei = 0n;

  for (const tx of transactions) {
    const valWei = BigInt(tx.valueWei || '0');

    if (tx.direction === 'SELF_TRANSFER') {
      selfTransferCount++;
      // Self transfers do not increase external balance
    } else if (tx.direction === 'INCOMING') {
      incomingCount++;
      totalReceivedWei += valWei;
    } else if (tx.direction === 'OUTGOING') {
      outgoingCount++;
      totalSentWei += valWei;
    }
  }

  // Format ETH strings
  const formatEthVal = (wei: bigint) => {
    const ethStr = (Number(wei) / 1e18).toFixed(4);
    return ethStr;
  };

  const netWei = totalReceivedWei - totalSentWei;
  const netEthFormatted = (Number(netWei) / 1e18).toFixed(4);

  return {
    totalCount: transactions.length,
    incomingCount,
    outgoingCount,
    selfTransferCount,
    totalReceivedEth: formatEthVal(totalReceivedWei),
    totalSentEth: formatEthVal(totalSentWei),
    netVolumeEth: netEthFormatted
  };
}
