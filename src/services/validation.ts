import { isAddress, getAddress } from 'ethers';
import { TransactionDirection, WalletValidationResult } from '../types/transaction';

/**
 * Validates an Ethereum address string and returns normalized checksum representation
 * if valid, or a descriptive error message if invalid.
 */
export function validateEthereumAddress(rawInput: string | null | undefined): WalletValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      normalizedAddress: null,
      error: 'Wallet address cannot be empty.'
    };
  }

  const trimmed = rawInput.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      normalizedAddress: null,
      error: 'Wallet address cannot be empty or blank spaces.'
    };
  }

  if (!trimmed.startsWith('0x') && !trimmed.startsWith('0X')) {
    return {
      isValid: false,
      normalizedAddress: null,
      error: 'Ethereum address must start with "0x" prefix.'
    };
  }

  if (trimmed.length !== 42) {
    return {
      isValid: false,
      normalizedAddress: null,
      error: `Invalid address length: expected 42 characters (including 0x), received ${trimmed.length}.`
    };
  }

  const hexPattern = /^0x[0-9a-fA-F]{40}$/;
  if (!hexPattern.test(trimmed)) {
    return {
      isValid: false,
      normalizedAddress: null,
      error: 'Address contains non-hexadecimal characters.'
    };
  }

  // Validate using ethers isAddress
  if (!isAddress(trimmed)) {
    return {
      isValid: false,
      normalizedAddress: null,
      error: 'Invalid Ethereum address (failed checksum or format validation).'
    };
  }

  try {
    const normalized = getAddress(trimmed);
    return {
      isValid: true,
      normalizedAddress: normalized,
      error: null
    };
  } catch (err: unknown) {
    return {
      isValid: false,
      normalizedAddress: null,
      error: err instanceof Error ? err.message : 'Failed to normalize address.'
    };
  }
}

/**
 * Classifies transaction direction relative to a target wallet address.
 * 
 * Rules:
 * - SELF_TRANSFER: Both sender and recipient match the queried address.
 * - OUTGOING: Transaction sender matches the queried address.
 * - INCOMING: Transaction recipient matches the queried address.
 * - UNKNOWN: Neither matches (e.g. internal or irrelevant tx in generic dataset).
 */
export function classifyTransactionDirection(
  from: string | null | undefined,
  to: string | null | undefined,
  targetAddress: string
): TransactionDirection {
  if (!targetAddress || !isAddress(targetAddress)) {
    return 'UNKNOWN';
  }

  const normalizedTarget = getAddress(targetAddress.trim());
  const normalizedFrom = from && isAddress(from.trim()) ? getAddress(from.trim()) : null;
  const normalizedTo = to && isAddress(to.trim()) ? getAddress(to.trim()) : null;

  const isSender = normalizedFrom !== null && normalizedFrom === normalizedTarget;
  const isRecipient = normalizedTo !== null && normalizedTo === normalizedTarget;

  if (isSender && isRecipient) {
    return 'SELF_TRANSFER';
  }

  if (isSender) {
    return 'OUTGOING';
  }

  if (isRecipient) {
    return 'INCOMING';
  }

  return 'UNKNOWN';
}
