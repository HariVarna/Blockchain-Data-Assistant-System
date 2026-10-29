import { NormalizedTransaction } from '../types/transaction';

export const TEST_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
export const ALICE_WALLET_ADDRESS = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
export const BOB_WALLET_ADDRESS = '0x6b75d8AF000000e20B7a7DDf000Ba900b4009A80';
export const THIRD_PARTY_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

/**
 * Predictable, deterministic test dataset with strictly verified sample values.
 * Isolated from live application data.
 */
export const PREDICTABLE_TEST_TRANSACTIONS: NormalizedTransaction[] = [
  // 1. INCOMING transfer of 1.0 ETH at Block 100
  {
    transactionHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    blockNumber: 100,
    timestamp: 1700000100,
    from: BOB_WALLET_ADDRESS,
    to: TEST_WALLET_ADDRESS,
    valueWei: '1000000000000000000', // 1.0 ETH
    valueEth: '1.0',
    direction: 'INCOMING',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures'
  },
  // 2. INCOMING transfer of 0.5 ETH at Block 200
  {
    transactionHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
    blockNumber: 200,
    timestamp: 1700000200,
    from: ALICE_WALLET_ADDRESS,
    to: TEST_WALLET_ADDRESS,
    valueWei: '500000000000000000', // 0.5 ETH
    valueEth: '0.5',
    direction: 'INCOMING',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures'
  },
  // 3. OUTGOING transfer of 0.25 ETH at Block 300
  {
    transactionHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
    blockNumber: 300,
    timestamp: 1700000300,
    from: TEST_WALLET_ADDRESS,
    to: ALICE_WALLET_ADDRESS,
    valueWei: '250000000000000000', // 0.25 ETH
    valueEth: '0.25',
    direction: 'OUTGOING',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures'
  },
  // 4. OUTGOING transfer of 2.0 ETH at Block 400
  {
    transactionHash: '0x4444444444444444444444444444444444444444444444444444444444444444',
    blockNumber: 400,
    timestamp: 1700000400,
    from: TEST_WALLET_ADDRESS,
    to: BOB_WALLET_ADDRESS,
    valueWei: '2000000000000000000', // 2.0 ETH
    valueEth: '2.0',
    direction: 'OUTGOING',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures'
  },
  // 5. SELF-TRANSFER of 0 ETH at Block 250 (Single counted, does not inflate volume)
  {
    transactionHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
    blockNumber: 250,
    timestamp: 1700000250,
    from: TEST_WALLET_ADDRESS,
    to: TEST_WALLET_ADDRESS,
    valueWei: '0',
    valueEth: '0.0',
    direction: 'SELF_TRANSFER',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures'
  },
  // 6. CONTRACT CREATION with recipient null at Block 350
  {
    transactionHash: '0x6666666666666666666666666666666666666666666666666666666666666666',
    blockNumber: 350,
    timestamp: 1700000350,
    from: TEST_WALLET_ADDRESS,
    to: null,
    valueWei: '0',
    valueEth: '0.0',
    direction: 'OUTGOING',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures',
    isContractCreation: true
  },
  // 7. Large integer Wei transaction (50.123456789 ETH) at Block 500
  {
    transactionHash: '0x7777777777777777777777777777777777777777777777777777777777777777',
    blockNumber: 500,
    timestamp: 1700000500,
    from: BOB_WALLET_ADDRESS,
    to: TEST_WALLET_ADDRESS,
    valueWei: '50123456789000000000', // 50.123456789 ETH
    valueEth: '50.123456789',
    direction: 'INCOMING',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures'
  },
  // 8. UNKNOWN direction (neither from nor to matches target) at Block 150
  {
    transactionHash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    blockNumber: 150,
    timestamp: 1700000150,
    from: ALICE_WALLET_ADDRESS,
    to: THIRD_PARTY_ADDRESS,
    valueWei: '100000000000000000', // 0.1 ETH
    valueEth: '0.1',
    direction: 'UNKNOWN',
    status: 'SUCCESS',
    dataSource: 'Test Fixtures'
  },
  // 9. Missing / zero block number record
  {
    transactionHash: '0x9999999999999999999999999999999999999999999999999999999999999999',
    blockNumber: 0,
    timestamp: null,
    from: TEST_WALLET_ADDRESS,
    to: BOB_WALLET_ADDRESS,
    valueWei: '50000000000000000', // 0.05 ETH
    valueEth: '0.05',
    direction: 'OUTGOING',
    status: 'PENDING',
    dataSource: 'Test Fixtures'
  }
];
