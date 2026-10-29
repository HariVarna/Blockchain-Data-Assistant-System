import { JsonRpcProvider, formatEther, isAddress, getAddress } from 'ethers';
import { NetworkInfo } from '../types/transaction';

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_NETWORK_NAME = 'Ethereum Sepolia Testnet';

export const DEFAULT_SEPOLIA_RPC_URLS = [
  import.meta.env?.VITE_SEPOLIA_RPC_URL || '',
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org'
].filter(Boolean);

/**
 * Validates Sepolia connection and retrieves live chain metadata.
 * 
 * Verifies:
 * - Network accessibility
 * - Chain ID is 11155111
 * - Measures latency
 * - Retrieves latest block number
 */
export async function connectAndVerifySepolia(
  rpcUrl: string,
  timeoutMs = 8000
): Promise<NetworkInfo> {
  const cleanUrl = rpcUrl.trim();

  if (!cleanUrl) {
    throw new Error('RPC endpoint URL cannot be empty.');
  }

  // Validate URL structure
  try {
    const parsed = new URL(cleanUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Invalid RPC protocol "${parsed.protocol}". Expected http:// or https://.`);
    }
  } catch (urlErr) {
    throw new Error(`Malformed RPC URL: ${urlErr instanceof Error ? urlErr.message : cleanUrl}`);
  }

  const startTime = Date.now();
  const provider = new JsonRpcProvider(cleanUrl, undefined, {
    staticNetwork: false,
    batchMaxCount: 1
  });

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`RPC connection timed out after ${timeoutMs}ms. Please check your network or try a different RPC URL.`));
    }, timeoutMs);
  });

  try {
    const networkPromise = (async () => {
      const [network, blockNumber] = await Promise.all([
        provider.getNetwork(),
        provider.getBlockNumber()
      ]);
      return { network, blockNumber };
    })();

    const { network, blockNumber } = await Promise.race([networkPromise, timeoutPromise]);
    const latencyMs = Date.now() - startTime;

    const chainIdNum = Number(network.chainId);

    if (chainIdNum !== SEPOLIA_CHAIN_ID) {
      throw new Error(
        `Network mismatch! Connected to chain ID ${chainIdNum} (${network.name}), but Ethereum Sepolia expects Chain ID 11155111.`
      );
    }

    return {
      chainId: chainIdNum,
      name: SEPOLIA_NETWORK_NAME,
      currentBlock: blockNumber,
      isSepolia: true,
      latencyMs,
      rpcUrl: cleanUrl,
      connectedAt: new Date()
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Improve typical network error messages
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        throw new Error(`Unable to reach RPC endpoint at ${cleanUrl}. The node may be offline or unreachable.`);
      }
      throw error;
    }
    throw new Error(String(error));
  }
}

/**
 * Fetches the current native Sepolia ETH balance for a validated wallet address.
 */
export async function fetchWalletBalanceEth(
  address: string,
  rpcUrl: string
): Promise<{ balanceEth: string; balanceWei: string }> {
  if (!address || !isAddress(address)) {
    throw new Error('Invalid address supplied to balance fetcher.');
  }

  const normalized = getAddress(address.trim());
  const provider = new JsonRpcProvider(rpcUrl);

  try {
    const balanceWei = await provider.getBalance(normalized);
    const balanceEth = formatEther(balanceWei);
    return {
      balanceEth: Number(balanceEth).toFixed(5),
      balanceWei: balanceWei.toString()
    };
  } catch (err: unknown) {
    throw new Error(`Failed to fetch wallet balance: ${err instanceof Error ? err.message : String(err)}`);
  }
}
