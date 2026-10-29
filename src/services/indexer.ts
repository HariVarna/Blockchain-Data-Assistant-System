import { isAddress, getAddress } from 'ethers';
import { NormalizedTransaction } from '../types/transaction';
import { normalizeExplorerTransaction } from './normalizer';

export interface IndexerFetchOptions {
  apiUrl?: string;
  apiKey?: string;
  page?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
}

export interface IndexerFetchResult {
  transactions: NormalizedTransaction[];
  dataSource: string;
  totalFetched: number;
  hasMore: boolean;
  rawMessage?: string;
}

const DEFAULT_EXPLORER_API =
  import.meta.env?.VITE_EXPLORER_API_URL ||
  'https://eth-sepolia.blockscout.com/api';

const DEFAULT_API_KEY =
  import.meta.env?.VITE_ETHERSCAN_API_KEY || '';

/**
 * Fetches transaction history for a given wallet address using an explorer or indexer API.
 * 
 * Supports Blockscout Sepolia (free, no key required) and Etherscan Sepolia API.
 */
export async function fetchAddressTransactionsFromIndexer(
  address: string,
  options: IndexerFetchOptions = {}
): Promise<IndexerFetchResult> {
  if (!address || !isAddress(address)) {
    throw new Error('A valid Ethereum address is required before querying transaction history.');
  }

  const normalizedAddress = getAddress(address.trim());
  const baseUrl = (options.apiUrl || DEFAULT_EXPLORER_API).replace(/\/$/, '');
  const apiKey = options.apiKey !== undefined ? options.apiKey : DEFAULT_API_KEY;
  const page = options.page || 1;
  const offset = options.offset || 50;
  const sort = options.sort || 'desc';

  // Build query params
  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address: normalizedAddress,
    startblock: '0',
    endblock: '99999999',
    page: String(page),
    offset: String(offset),
    sort
  });

  if (apiKey) {
    params.append('apikey', apiKey.trim());
  }

  const requestUrl = `${baseUrl}?${params.toString()}`;
  const sourceName = baseUrl.includes('blockscout')
    ? 'Blockscout Sepolia Indexer API'
    : baseUrl.includes('etherscan')
    ? 'Etherscan Sepolia Indexer API'
    : 'Custom Sepolia Indexer API';

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Explorer API responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for standard Etherscan/Blockscout API responses
    if (data.status === '0') {
      const message = String(data.message || '');
      const resultStr = String(data.result || '');

      // Check if it's just an empty history
      if (
        message.toLowerCase().includes('no transactions found') ||
        resultStr.toLowerCase().includes('no transactions found') ||
        (Array.isArray(data.result) && data.result.length === 0)
      ) {
        return {
          transactions: [],
          dataSource: sourceName,
          totalFetched: 0,
          hasMore: false,
          rawMessage: 'No transactions found on Sepolia for this address.'
        };
      }

      // Check for rate limit or key error
      if (
        resultStr.toLowerCase().includes('rate limit') ||
        resultStr.toLowerCase().includes('max rate limit')
      ) {
        throw new Error('Explorer API rate limit reached. Please wait a few seconds or configure a custom API key.');
      }

      if (resultStr.toLowerCase().includes('invalid api key')) {
        throw new Error('Invalid Etherscan API key supplied. Please verify VITE_ETHERSCAN_API_KEY.');
      }

      throw new Error(`Indexer error: ${data.message || 'Unknown error'} (${resultStr})`);
    }

    if (!Array.isArray(data.result)) {
      throw new Error('Invalid API response format: expected result to be an array of transactions.');
    }

    const transactions: NormalizedTransaction[] = data.result.map((rawTx: Record<string, unknown>) =>
      normalizeExplorerTransaction(rawTx, normalizedAddress, sourceName)
    );

    return {
      transactions,
      dataSource: sourceName,
      totalFetched: transactions.length,
      hasMore: transactions.length === offset,
      rawMessage: data.message
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Network error connecting to ${baseUrl}. The indexer may be blocked by CORS or unavailable.`);
      }
      throw error;
    }
    throw new Error(String(error));
  }
}
