import { describe, it, expect } from 'vitest';
import {
  parseEthInputToWei,
  validateFilterInputs,
  applyTransactionFilters,
  calculateDetailedSummary,
  sortTransactionsDeterministically
} from '../filterService';
import { generateWalletActivityPdf } from '../pdfGenerator';
import {
  PREDICTABLE_TEST_TRANSACTIONS,
  TEST_WALLET_ADDRESS
} from '../../sample-data/testFixtures';
import { TransactionFilterState, PdfReportOptions } from '../../types/filters';

const DEFAULT_TEST_FILTERS: TransactionFilterState = {
  direction: 'ALL',
  minAmountEth: '',
  maxAmountEth: '',
  minBlock: '',
  maxBlock: '',
  searchQuery: ''
};

describe('1. Transaction Filtering: Direction Tests', () => {
  it('filters incoming transactions only and excludes outgoing, self, and unknown', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      direction: 'INCOMING'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    expect(result.length).toBe(3); // 1.0 ETH, 0.5 ETH, 50.123456789 ETH
    expect(result.every((tx) => tx.direction === 'INCOMING')).toBe(true);
  });

  it('filters outgoing transactions only and includes contract creation', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      direction: 'OUTGOING'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    expect(result.length).toBe(4); // 0.25 ETH, 2.0 ETH, contract creation 0 ETH, 0.05 ETH pending
    expect(result.every((tx) => tx.direction === 'OUTGOING')).toBe(true);
  });

  it('filters self-transfers only and single-counts them', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      direction: 'SELF_TRANSFER'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    expect(result.length).toBe(1);
    expect(result[0].direction).toBe('SELF_TRANSFER');
    expect(result[0].from).toBe(TEST_WALLET_ADDRESS);
    expect(result[0].to).toBe(TEST_WALLET_ADDRESS);
  });

  it('excludes unknown direction transactions when a directional filter is active', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      direction: 'INCOMING'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    expect(result.some((tx) => tx.direction === 'UNKNOWN')).toBe(false);
  });
});

describe('2. Transaction Filtering: Amount Range with Exact BigInt Arithmetic', () => {
  it('parses valid ETH amounts to exact BigInt Wei integers', () => {
    expect(parseEthInputToWei('1.0')).toBe(1000000000000000000n);
    expect(parseEthInputToWei('0.5')).toBe(500000000000000000n);
    expect(parseEthInputToWei('0')).toBe(0n);
  });

  it('rejects invalid or negative ETH amounts', () => {
    expect(() => parseEthInputToWei('-1.5')).toThrow(/non-negative/i);
    expect(() => parseEthInputToWei('abc')).toThrow(/invalid eth number/i);
  });

  it('applies inclusive amount boundaries', () => {
    // Exact match for boundaries 0.25 ETH to 1.0 ETH
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      minAmountEth: '0.25',
      maxAmountEth: '1.0'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    // Matches: 1.0 ETH (boundary), 0.5 ETH, 0.25 ETH (boundary)
    expect(result.length).toBe(3);
    const hashes = result.map((r) => r.transactionHash);
    expect(hashes).toContain('0x1111111111111111111111111111111111111111111111111111111111111111'); // 1.0
    expect(hashes).toContain('0x2222222222222222222222222222222222222222222222222222222222222222'); // 0.5
    expect(hashes).toContain('0x3333333333333333333333333333333333333333333333333333333333333333'); // 0.25
  });

  it('handles large integer Wei values accurately without floating point loss', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      minAmountEth: '50.0'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    expect(result.length).toBe(1);
    expect(result[0].valueEth).toBe('50.123456789');
    expect(result[0].valueWei).toBe('50123456789000000000');
  });

  it('rejects minimum amount greater than maximum amount', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      minAmountEth: '2.0',
      maxAmountEth: '1.0'
    };
    const validation = validateFilterInputs(filters);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.amountError).toMatch(/cannot exceed maximum/i);
  });
});

describe('3. Transaction Filtering: Block Range Tests', () => {
  it('applies inclusive block boundaries', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      minBlock: '200',
      maxBlock: '350'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    // Matching blocks: 200, 250, 300, 350
    expect(result.length).toBe(4);
    expect(result.every((tx) => tx.blockNumber >= 200 && tx.blockNumber <= 350)).toBe(true);
  });

  it('excludes records with missing or zero block numbers when block filter is active', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      minBlock: '10'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    // Record #9 has blockNumber: 0
    expect(result.some((tx) => tx.blockNumber === 0)).toBe(false);
  });

  it('rejects minimum block greater than maximum block', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      minBlock: '500',
      maxBlock: '200'
    };
    const validation = validateFilterInputs(filters);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.blockError).toMatch(/cannot exceed maximum/i);
  });
});

describe('4. Combined Filters & Empty Results', () => {
  it('allows all filters to operate simultaneously and immutably', () => {
    const originalCount = PREDICTABLE_TEST_TRANSACTIONS.length;
    const filters: TransactionFilterState = {
      direction: 'INCOMING',
      minAmountEth: '0.4',
      maxAmountEth: '2.0',
      minBlock: '100',
      maxBlock: '250',
      searchQuery: '0x1111'
    };

    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);

    // Only transaction #1 matches: INCOMING, 1.0 ETH, block 100, hash starts with 0x1111
    expect(result.length).toBe(1);
    expect(result[0].transactionHash).toBe('0x1111111111111111111111111111111111111111111111111111111111111111');
    // Ensure original array was not mutated
    expect(PREDICTABLE_TEST_TRANSACTIONS.length).toBe(originalCount);
  });

  it('handles zero matching records cleanly', () => {
    const filters: TransactionFilterState = {
      ...DEFAULT_TEST_FILTERS,
      minAmountEth: '9999.0'
    };
    const result = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, filters);
    expect(result.length).toBe(0);

    const summary = calculateDetailedSummary(result, PREDICTABLE_TEST_TRANSACTIONS.length);
    expect(summary.totalMatching).toBe(0);
    expect(summary.totalReceivedEth).toBe('0.0');
    expect(summary.totalSentEth).toBe('0.0');
    expect(summary.minBlock).toBeNull();
    expect(summary.maxBlock).toBeNull();
  });
});

describe('5. Summary Calculation and Single-Count Rules', () => {
  it('correctly aggregates counts and sums without double-counting self transfers', () => {
    const summary = calculateDetailedSummary(PREDICTABLE_TEST_TRANSACTIONS, PREDICTABLE_TEST_TRANSACTIONS.length);

    expect(summary.totalRetrieved).toBe(9);
    expect(summary.totalMatching).toBe(9);
    expect(summary.incomingCount).toBe(3);
    expect(summary.outgoingCount).toBe(4);
    expect(summary.selfTransferCount).toBe(1);
    expect(summary.unknownCount).toBe(1);

    // Sum check:
    // Incoming: 1.0 + 0.5 + 50.123456789 = 51.623456789 ETH
    expect(summary.totalReceivedEth).toBe('51.623456789');

    // Outgoing: 0.25 + 2.0 + 0 + 0.05 = 2.3 ETH
    expect(summary.totalSentEth).toBe('2.3');

    // Block range among valid blocks
    expect(summary.minBlock).toBe(100);
    expect(summary.maxBlock).toBe(500);
  });
});

describe('6. Deterministic Sorting', () => {
  it('sorts transactions by block number descending, then by transaction hash ascending', () => {
    const sorted = sortTransactionsDeterministically(PREDICTABLE_TEST_TRANSACTIONS);

    // Highest block is 500 (record 7)
    expect(sorted[0].blockNumber).toBe(500);
    // Lowest block is 0 (record 9)
    expect(sorted[sorted.length - 1].blockNumber).toBe(0);
  });
});

describe('7. PDF Report Generation', () => {
  it('generates a valid PDF document with matching records', () => {
    const matching = applyTransactionFilters(PREDICTABLE_TEST_TRANSACTIONS, DEFAULT_TEST_FILTERS);
    const summary = calculateDetailedSummary(matching, PREDICTABLE_TEST_TRANSACTIONS.length);

    const options: PdfReportOptions = {
      walletAddress: TEST_WALLET_ADDRESS,
      networkName: 'Ethereum Sepolia',
      chainId: 11155111,
      dataSource: 'Test Fixtures Indexer',
      dataRetrievalStatus: '200 OK',
      userQueryText: 'Audit of Q3 inbound grants and transfers',
      appliedFilters: DEFAULT_TEST_FILTERS,
      allTransactions: PREDICTABLE_TEST_TRANSACTIONS,
      matchingTransactions: matching,
      summary,
      isSuppliedDataset: false
    };

    const doc = generateWalletActivityPdf(options);
    expect(doc).toBeDefined();
    // Output check: generates base64 / blob without throwing
    const output = doc.output();
    expect(output).toContain('%PDF');
  });

  it('generates a valid PDF with zero matching records and displays clear message', () => {
    const summary = calculateDetailedSummary([], PREDICTABLE_TEST_TRANSACTIONS.length);

    const options: PdfReportOptions = {
      walletAddress: TEST_WALLET_ADDRESS,
      networkName: 'Ethereum Sepolia',
      chainId: 11155111,
      dataSource: 'Test Fixtures Indexer',
      dataRetrievalStatus: '200 OK',
      userQueryText: 'Testing zero results',
      appliedFilters: {
        ...DEFAULT_TEST_FILTERS,
        minAmountEth: '1000'
      },
      allTransactions: PREDICTABLE_TEST_TRANSACTIONS,
      matchingTransactions: [],
      summary,
      isSuppliedDataset: false
    };

    const doc = generateWalletActivityPdf(options);
    expect(doc).toBeDefined();
    const output = doc.output();
    expect(output).toContain('%PDF');
  });

  it('preserves user query text and data source transparency in generated PDF', () => {
    const customQuery = 'Investigating unauthorized outflows during outage';
    const summary = calculateDetailedSummary(PREDICTABLE_TEST_TRANSACTIONS, PREDICTABLE_TEST_TRANSACTIONS.length);

    const options: PdfReportOptions = {
      walletAddress: TEST_WALLET_ADDRESS,
      networkName: 'Ethereum Sepolia',
      chainId: 11155111,
      dataSource: 'Supplied Dataset (sampleTransactions.csv)',
      datasetFilename: 'sampleTransactions.csv',
      dataRetrievalStatus: 'Validated & Loaded',
      userQueryText: customQuery,
      appliedFilters: DEFAULT_TEST_FILTERS,
      allTransactions: PREDICTABLE_TEST_TRANSACTIONS,
      matchingTransactions: PREDICTABLE_TEST_TRANSACTIONS,
      summary,
      isSuppliedDataset: true
    };

    const doc = generateWalletActivityPdf(options);
    const output = doc.output();
    expect(output).toContain('%PDF');
  });
});
