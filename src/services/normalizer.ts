import { formatEther, isAddress, getAddress } from 'ethers';
import { NormalizedTransaction, TransactionDirection, TransactionStatus } from '../types/transaction';
import { classifyTransactionDirection } from './validation';

/**
 * Safely converts any Wei value (string, number, or bigint) to formatted Ether string and Wei string.
 */
export function formatEtherSafe(valueWeiRaw: unknown): { wei: string; eth: string } {
  try {
    if (valueWeiRaw === null || valueWeiRaw === undefined || valueWeiRaw === '') {
      return { wei: '0', eth: '0.0' };
    }

    let weiStr = String(valueWeiRaw).trim();

    // Check if it's hex format e.g. "0x0" or "0x1234"
    if (weiStr.startsWith('0x') || weiStr.startsWith('0X')) {
      const parsedBigInt = BigInt(weiStr);
      weiStr = parsedBigInt.toString();
    } else {
      // Validate string has only digits or sci notation
      if (/^\d+$/.test(weiStr)) {
        // Direct integer
      } else if (!isNaN(Number(weiStr))) {
        // Floating number in wei or already parsed
        const bigIntVal = BigInt(Math.floor(Number(weiStr)));
        weiStr = bigIntVal.toString();
      } else {
        return { wei: '0', eth: '0.0' };
      }
    }

    const eth = formatEther(BigInt(weiStr));
    return { wei: weiStr, eth };
  } catch {
    return { wei: '0', eth: '0.0' };
  }
}

/**
 * Parses timestamp from various formats (unix seconds, milliseconds, or ISO date string).
 */
export function parseTimestampSafe(rawTimestamp: unknown): number | null {
  if (rawTimestamp === null || rawTimestamp === undefined || rawTimestamp === '') {
    return null;
  }

  // If already a number or numeric string
  const num = Number(rawTimestamp);
  if (!isNaN(num) && num > 0) {
    // If it's in milliseconds (> 10^11, e.g. year 2001 in ms is 1000000000000)
    if (num > 100000000000) {
      return Math.floor(num / 1000);
    }
    return Math.floor(num);
  }

  // Try parsing ISO date string
  if (typeof rawTimestamp === 'string') {
    const parsedDate = Date.parse(rawTimestamp);
    if (!isNaN(parsedDate)) {
      return Math.floor(parsedDate / 1000);
    }
  }

  return null;
}

/**
 * Normalizes raw transaction from explorer/indexer API (Etherscan, Blockscout, etc.)
 */
export function normalizeExplorerTransaction(
  raw: Record<string, unknown>,
  queriedAddress: string,
  dataSourceName: string
): NormalizedTransaction {
  const hash = String(raw.hash || raw.transactionHash || '').trim();
  const blockNumber = Number(raw.blockNumber || 0);
  const timestamp = parseTimestampSafe(raw.timeStamp || raw.timestamp);

  // Address handling
  const rawFrom = String(raw.from || '').trim();
  const rawTo = raw.to ? String(raw.to).trim() : null;

  const from = isAddress(rawFrom) ? getAddress(rawFrom) : rawFrom;
  const to = rawTo && isAddress(rawTo) ? getAddress(rawTo) : (rawTo || null);

  const isContractCreation = !rawTo || rawTo === '' || rawTo === '0x' || raw.contractAddress !== undefined && raw.contractAddress !== '';

  // Value formatting
  const { wei, eth } = formatEtherSafe(raw.value);

  // Direction
  const direction: TransactionDirection = classifyTransactionDirection(from, to, queriedAddress);

  // Status calculation
  let status: TransactionStatus = 'UNKNOWN';
  if (raw.isError !== undefined) {
    status = String(raw.isError) === '0' ? 'SUCCESS' : 'FAILED';
  } else if (raw.txreceipt_status !== undefined) {
    status = String(raw.txreceipt_status) === '1' ? 'SUCCESS' : 'FAILED';
  } else if (raw.status !== undefined) {
    const s = String(raw.status).toUpperCase();
    if (s === 'SUCCESS' || s === '1' || s === 'OK') status = 'SUCCESS';
    else if (s === 'FAILED' || s === '0' || s === 'ERROR') status = 'FAILED';
  }

  // Gas and fees
  let feeEth: string | undefined;
  if (raw.gasUsed && raw.gasPrice) {
    try {
      const gas = BigInt(String(raw.gasUsed));
      const price = BigInt(String(raw.gasPrice));
      const totalFeeWei = gas * price;
      feeEth = formatEther(totalFeeWei);
    } catch {
      // ignore calculation failure
    }
  }

  return {
    transactionHash: hash,
    blockNumber,
    timestamp,
    from,
    to: isContractCreation ? null : to,
    valueWei: wei,
    valueEth: eth,
    direction,
    status,
    dataSource: dataSourceName,
    gasUsed: raw.gasUsed ? String(raw.gasUsed) : undefined,
    gasPriceWei: raw.gasPrice ? String(raw.gasPrice) : undefined,
    feeEth,
    isContractCreation
  };
}

/**
 * Normalizes a transaction record imported from a supplied JSON or CSV dataset.
 */
export function normalizeDatasetRecord(
  raw: Record<string, unknown>,
  queriedAddress: string,
  dataSourceName = 'Supplied Dataset'
): NormalizedTransaction {
  // Hash
  const hash = String(
    raw.transactionHash ||
    raw.transaction_hash ||
    raw.txHash ||
    raw.hash ||
    ''
  ).trim();

  // Block
  const blockNumber = Number(
    raw.blockNumber ||
    raw.block_number ||
    raw.block ||
    0
  );

  // Timestamp
  const timestamp = parseTimestampSafe(
    raw.timestamp ||
    raw.timeStamp ||
    raw.date ||
    raw.datetime
  );

  // From / To
  const rawFrom = String(raw.from || raw.sender || raw.fromAddress || '').trim();
  const rawTo = raw.to || raw.recipient || raw.toAddress;
  const rawToStr = rawTo !== null && rawTo !== undefined ? String(rawTo).trim() : null;

  const from = isAddress(rawFrom) ? getAddress(rawFrom) : rawFrom;
  const to = rawToStr && isAddress(rawToStr) ? getAddress(rawToStr) : (rawToStr || null);

  const isContractCreation = !rawToStr || rawToStr === '' || rawToStr === '0x' || rawToStr.toLowerCase() === 'contract_creation';

  // Value: handles both "valueWei" or direct "value" or "valueEth"
  let wei = '0';
  let eth = '0.0';

  if (raw.valueWei !== undefined) {
    const formatted = formatEtherSafe(raw.valueWei);
    wei = formatted.wei;
    eth = formatted.eth;
  } else if (raw.valueEth !== undefined) {
    const ethStr = String(raw.valueEth).trim();
    eth = ethStr;
    try {
      // Approximate back to Wei if only ETH is provided
      const floatVal = parseFloat(ethStr);
      if (!isNaN(floatVal)) {
        const factor = BigInt(10 ** 18);
        const whole = BigInt(Math.floor(floatVal));
        const fraction = BigInt(Math.round((floatVal - Math.floor(floatVal)) * 10 ** 18));
        wei = (whole * factor + fraction).toString();
      }
    } catch {
      wei = '0';
    }
  } else {
    const formatted = formatEtherSafe(raw.value);
    wei = formatted.wei;
    eth = formatted.eth;
  }

  // Direction: allow explicit direction or calculate relative to queried address
  let direction: TransactionDirection = classifyTransactionDirection(from, to, queriedAddress);
  if (raw.direction && ['INCOMING', 'OUTGOING', 'SELF_TRANSFER', 'UNKNOWN'].includes(String(raw.direction).toUpperCase())) {
    direction = String(raw.direction).toUpperCase() as TransactionDirection;
  }

  // Status
  let status: TransactionStatus = 'SUCCESS';
  if (raw.status) {
    const s = String(raw.status).toUpperCase();
    if (s.includes('SUCCESS') || s === '1' || s === 'OK') status = 'SUCCESS';
    else if (s.includes('FAIL') || s === '0' || s === 'ERROR') status = 'FAILED';
    else if (s.includes('PENDING')) status = 'PENDING';
    else status = 'UNKNOWN';
  }

  return {
    transactionHash: hash,
    blockNumber,
    timestamp,
    from,
    to: isContractCreation ? null : to,
    valueWei: wei,
    valueEth: eth,
    direction,
    status,
    dataSource: dataSourceName,
    gasUsed: raw.gasUsed ? String(raw.gasUsed) : undefined,
    gasPriceWei: raw.gasPriceWei || raw.gasPrice ? String(raw.gasPriceWei || raw.gasPrice) : undefined,
    feeEth: raw.feeEth ? String(raw.feeEth) : undefined,
    isContractCreation
  };
}
