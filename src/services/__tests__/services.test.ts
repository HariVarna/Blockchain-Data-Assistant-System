import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEthereumAddress, classifyTransactionDirection } from '../validation';
import {
  parseCsvDataset,
  parseJsonDataset,
  filterDatasetByAddress,
  calculateTransactionSummary,
  isValidTransactionHash
} from '../dataset';
import { normalizeExplorerTransaction, normalizeDatasetRecord, formatEtherSafe } from '../normalizer';
import { SEPOLIA_CHAIN_ID, connectAndVerifySepolia } from '../rpc';
import { fetchAddressTransactionsFromIndexer } from '../indexer';

describe('1. Wallet Address Validation', () => {
  const validChecksumAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const validLowerAddress = '0x742d35cc6634c0532925a3b844bc454e4438f44e';

  it('validates a valid checksummed Ethereum address and returns normalized address', () => {
    const result = validateEthereumAddress(validChecksumAddress);
    expect(result.isValid).toBe(true);
    expect(result.normalizedAddress).toBe(validChecksumAddress);
    expect(result.error).toBeNull();
  });

  it('normalizes a lowercase valid Ethereum address to checksummed format', () => {
    const result = validateEthereumAddress(validLowerAddress);
    expect(result.isValid).toBe(true);
    expect(result.normalizedAddress).toBe(validChecksumAddress);
    expect(result.error).toBeNull();
  });

  it('rejects an empty address string', () => {
    const result = validateEthereumAddress('');
    expect(result.isValid).toBe(false);
    expect(result.normalizedAddress).toBeNull();
    expect(result.error).toMatch(/cannot be empty/i);
  });

  it('rejects an address with only whitespace', () => {
    const result = validateEthereumAddress('   ');
    expect(result.isValid).toBe(false);
    expect(result.normalizedAddress).toBeNull();
    expect(result.error).toMatch(/cannot be empty/i);
  });

  it('rejects address without 0x prefix', () => {
    const result = validateEthereumAddress('742d35Cc6634C0532925a3b844Bc454e4438f44e');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/0x.*prefix/i);
  });

  it('rejects an address that has invalid length', () => {
    const result = validateEthereumAddress('0x1234');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/length/i);
  });

  it('rejects an address containing invalid non-hexadecimal characters', () => {
    const result = validateEthereumAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44Z');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/non-hexadecimal/i);
  });

  it('rejects an address with an invalid checksum', () => {
    // Modify one capitalization bit
    const badChecksum = '0x742D35Cc6634C0532925a3b844Bc454e4438f44e';
    const result = validateEthereumAddress(badChecksum);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/checksum|invalid/i);
  });
});

describe('2. Transaction Direction Classification', () => {
  const targetWallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const otherWallet = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

  it('classifies as OUTGOING when sender is queried address', () => {
    const direction = classifyTransactionDirection(targetWallet, otherWallet, targetWallet);
    expect(direction).toBe('OUTGOING');
  });

  it('classifies as INCOMING when recipient is queried address', () => {
    const direction = classifyTransactionDirection(otherWallet, targetWallet, targetWallet);
    expect(direction).toBe('INCOMING');
  });

  it('classifies as SELF_TRANSFER when both sender and recipient are queried address', () => {
    const direction = classifyTransactionDirection(targetWallet, targetWallet, targetWallet);
    expect(direction).toBe('SELF_TRANSFER');
  });

  it('classifies as UNKNOWN when neither sender nor recipient match queried address', () => {
    const thirdParty = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const direction = classifyTransactionDirection(otherWallet, thirdParty, targetWallet);
    expect(direction).toBe('UNKNOWN');
  });

  it('handles lowercase and checksum address comparisons without case sensitivity issues', () => {
    const lowerTarget = targetWallet.toLowerCase();
    const direction = classifyTransactionDirection(lowerTarget, otherWallet, targetWallet);
    expect(direction).toBe('OUTGOING');
  });
});

describe('3. Normalization and Edge Cases', () => {
  const targetWallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

  it('handles contract creation safely when recipient "to" is null or empty', () => {
    const raw = {
      hash: '0x4a8f9c1b7e3d2a0f8b6e5c4d3a2b1f0e9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a41',
      blockNumber: '12345',
      from: targetWallet,
      to: '',
      value: '0',
      isError: '0'
    };

    const normalized = normalizeExplorerTransaction(raw, targetWallet, 'Test Explorer');
    expect(normalized.to).toBeNull();
    expect(normalized.isContractCreation).toBe(true);
    expect(normalized.direction).toBe('OUTGOING');
    expect(normalized.status).toBe('SUCCESS');
  });

  it('accurately parses and formats Wei to Ether using formatEther', () => {
    const res1 = formatEtherSafe('1000000000000000000');
    expect(res1.eth).toBe('1.0');
    expect(res1.wei).toBe('1000000000000000000');

    const res2 = formatEtherSafe('500000000000000000');
    expect(res2.eth).toBe('0.5');

    const resZero = formatEtherSafe('0');
    expect(resZero.eth).toBe('0.0');
    expect(resZero.wei).toBe('0');
  });

  it('handles missing transaction fields gracefully', () => {
    const emptyRaw = {};
    const normalized = normalizeDatasetRecord(emptyRaw, targetWallet, 'Test Source');
    expect(normalized.transactionHash).toBe('');
    expect(normalized.blockNumber).toBe(0);
    expect(normalized.timestamp).toBeNull();
    expect(normalized.valueWei).toBe('0');
    expect(normalized.valueEth).toBe('0.0');
    expect(normalized.direction).toBe('UNKNOWN');
  });
});

describe('4. Dataset Parsing and Malformed Rows Validation', () => {
  it('validates 32-byte transaction hash accurately', () => {
    expect(isValidTransactionHash('0x4a8f9c1b7e3d2a0f8b6e5c4d3a2b1f0e9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a41')).toBe(true);
    expect(isValidTransactionHash('0x123')).toBe(false); // too short
    expect(isValidTransactionHash('')).toBe(false);
    expect(isValidTransactionHash('not-a-hash')).toBe(false);
  });

  it('parses valid CSV dataset correctly', () => {
    const csv = `transactionHash,blockNumber,timestamp,from,to,valueWei,status
0x4a8f9c1b7e3d2a0f8b6e5c4d3a2b1f0e9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a41,100,1700000000,0x742d35Cc6634C0532925a3b844Bc454e4438f44e,0x8ba1f109551bD432803012645Ac136ddd64DBA72,1000000000000000000,SUCCESS`;

    const result = parseCsvDataset(csv);
    expect(result.malformedRecords.length).toBe(0);
    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].blockNumber).toBe(100);
    expect(result.transactions[0].valueEth).toBe('1.0');
  });

  it('reports malformed CSV rows with accurate row numbers and reasons', () => {
    const csvWithErrors = `transactionHash,blockNumber,timestamp,from,to,valueWei
invalid-hash,100,1700000000,0x742d35Cc6634C0532925a3b844Bc454e4438f44e,,0
0x4a8f9c1b7e3d2a0f8b6e5c4d3a2b1f0e9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a41,101,1700000001,invalid-from-address,,0`;

    const result = parseCsvDataset(csvWithErrors);
    expect(result.transactions.length).toBe(0);
    expect(result.malformedRecords.length).toBe(2);
    expect(result.malformedRecords[0].rowNumber).toBe(2);
    expect(result.malformedRecords[0].reason).toMatch(/invalid transactionHash/i);
    expect(result.malformedRecords[1].rowNumber).toBe(3);
    expect(result.malformedRecords[1].reason).toMatch(/invalid "from"/i);
  });

  it('reports malformed JSON dataset rows and handles parse syntax errors', () => {
    const invalidJson = `{ not valid json }`;
    const result1 = parseJsonDataset(invalidJson);
    expect(result1.transactions.length).toBe(0);
    expect(result1.malformedRecords[0].reason).toMatch(/syntax error/i);

    const nonArrayJson = `{"hash": "0x123"}`;
    const result2 = parseJsonDataset(nonArrayJson);
    expect(result2.malformedRecords[0].reason).toMatch(/must be an array/i);
  });

  it('filters dataset records by requested wallet address accurately and prevents double counting', () => {
    const target = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const other = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

    const testTxs = [
      // Incoming
      normalizeDatasetRecord({
        transactionHash: '0x4a8f9c1b7e3d2a0f8b6e5c4d3a2b1f0e9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a41',
        from: other,
        to: target,
        valueWei: '1000000000000000000' // 1 ETH
      }, target),
      // Outgoing
      normalizeDatasetRecord({
        transactionHash: '0x8e2c4b6a1d3f5e7a9b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f42',
        from: target,
        to: other,
        valueWei: '200000000000000000' // 0.2 ETH
      }, target),
      // Self-transfer
      normalizeDatasetRecord({
        transactionHash: '0x1f3e5d7c9b0a2f4e6d8c0b2a4f6e8d0c2a4b6e8f0a2d4c6b8e0a2f4d6c8b0e43',
        from: target,
        to: target,
        valueWei: '50000000000000000' // 0.05 ETH
      }, target),
      // Unrelated transaction (should be filtered out)
      normalizeDatasetRecord({
        transactionHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a47',
        from: other,
        to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        valueWei: '5000000000000000000'
      }, target)
    ];

    const filtered = filterDatasetByAddress(testTxs, target);
    expect(filtered.length).toBe(3);

    const summary = calculateTransactionSummary(filtered);
    expect(summary.totalCount).toBe(3);
    expect(summary.incomingCount).toBe(1);
    expect(summary.outgoingCount).toBe(1);
    expect(summary.selfTransferCount).toBe(1); // Self-transfer counted once, not twice!
    expect(summary.totalReceivedEth).toBe('1.0000');
    expect(summary.totalSentEth).toBe('0.2000');
    expect(summary.netVolumeEth).toBe('0.8000');
  });
});

describe('5. Sepolia Network & Chain ID Validation', () => {
  it('confirms Sepolia Chain ID is exactly 11155111', () => {
    expect(SEPOLIA_CHAIN_ID).toBe(11155111);
  });

  it('rejects an empty or invalid RPC URL', async () => {
    await expect(connectAndVerifySepolia('')).rejects.toThrow(/cannot be empty/i);
    await expect(connectAndVerifySepolia('not-a-valid-url')).rejects.toThrow(/malformed/i);
    await expect(connectAndVerifySepolia('ftp://rpc.sepolia.org')).rejects.toThrow(/invalid rpc protocol/i);
  });
});

describe('6. Indexer & Explorer Edge Cases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles empty transaction history response from explorer API gracefully', async () => {
    const mockEmptyResponse = {
      status: '0',
      message: 'No transactions found',
      result: []
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEmptyResponse
    } as unknown as Response);

    const result = await fetchAddressTransactionsFromIndexer('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', {
      apiUrl: 'https://test-indexer.com/api'
    });

    expect(result.transactions.length).toBe(0);
    expect(result.totalFetched).toBe(0);
    expect(result.rawMessage).toMatch(/no transactions found/i);
  });

  it('handles rate limit error from indexer API with clear message', async () => {
    const mockRateLimit = {
      status: '0',
      message: 'NOTOK',
      result: 'Max rate limit reached'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRateLimit
    } as unknown as Response);

    await expect(
      fetchAddressTransactionsFromIndexer('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', {
        apiUrl: 'https://test-indexer.com/api'
      })
    ).rejects.toThrow(/rate limit reached/i);
  });

  it('handles HTTP error responses from indexer API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable'
    } as unknown as Response);

    await expect(
      fetchAddressTransactionsFromIndexer('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
    ).rejects.toThrow(/HTTP 503/i);
  });
});
