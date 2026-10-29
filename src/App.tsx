import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  NetworkInfo,
  NormalizedTransaction,
  WalletValidationResult,
  DataSourceMode,
  TransactionDirection,
  MalformedRecordReport,
  TransactionSummaryStats
} from './types/transaction';
import { validateEthereumAddress } from './services/validation';
import {
  connectAndVerifySepolia,
  fetchWalletBalanceEth,
  DEFAULT_SEPOLIA_RPC_URLS
} from './services/rpc';
import { fetchAddressTransactionsFromIndexer } from './services/indexer';
import {
  getBundledSampleDataset,
  parseCsvDataset,
  parseJsonDataset,
  filterDatasetByAddress,
  calculateTransactionSummary
} from './services/dataset';

import { Header } from './components/Header';
import { WalletInput } from './components/WalletInput';
import { DataSourceSelector } from './components/DataSourceSelector';
import { StatsCards } from './components/StatsCards';
import { TransactionFilters } from './components/TransactionFilters';
import { TransactionTable } from './components/TransactionTable';
import { RpcConfigModal } from './components/RpcConfigModal';
import { MalformedRecordsModal } from './components/MalformedRecordsModal';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  // RPC & Network State
  const [activeRpcUrl, setActiveRpcUrl] = useState<string>(DEFAULT_SEPOLIA_RPC_URLS[0]);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isConnectingRpc, setIsConnectingRpc] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [isRpcModalOpen, setIsRpcModalOpen] = useState(false);

  // Wallet Address State
  // Default to exam demo address for immediate demonstration
  const [addressInput, setAddressInput] = useState<string>('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [validationResult, setValidationResult] = useState<WalletValidationResult | null>(null);
  const [walletBalanceEth, setWalletBalanceEth] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Data Source & Activity State
  const [mode, setMode] = useState<DataSourceMode>('INDEXER');
  const [rawTransactions, setRawTransactions] = useState<NormalizedTransaction[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySuccessMessage, setActivitySuccessMessage] = useState<string | null>(null);
  const [activeSourceLabel, setActiveSourceLabel] = useState<string>('Sepolia Explorer API');

  // Dataset specific state
  const [cachedDatasetTransactions, setCachedDatasetTransactions] = useState<NormalizedTransaction[]>([]);
  const [datasetMalformedRows, setDatasetMalformedRows] = useState<MalformedRecordReport[]>([]);
  const [isMalformedModalOpen, setIsMalformedModalOpen] = useState(false);

  // Filters & Sorting State
  const [selectedDirection, setSelectedDirection] = useState<TransactionDirection | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'VALUE_HIGH' | 'VALUE_LOW'>('NEWEST');

  // Verify Sepolia RPC
  const verifyRpcConnection = useCallback(async (rpcUrl: string) => {
    setIsConnectingRpc(true);
    setRpcError(null);
    try {
      const info = await connectAndVerifySepolia(rpcUrl);
      setNetworkInfo(info);
      setActiveRpcUrl(rpcUrl);
    } catch (err: unknown) {
      setNetworkInfo(null);
      setRpcError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsConnectingRpc(false);
    }
  }, []);

  // Initialize network on mount
  useEffect(() => {
    verifyRpcConnection(activeRpcUrl).catch(() => {
      // Handled in state
    });

    // Auto-validate initial demo address
    const initialValidation = validateEthereumAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    setValidationResult(initialValidation);

    // Preload bundled sample dataset
    const sample = getBundledSampleDataset();
    setCachedDatasetTransactions(sample.transactions);
    setActiveSourceLabel(sample.sourceLabel);
  }, []);

  // Fetch live balance when address is validated and RPC is connected
  const refreshWalletBalance = useCallback(async (address: string) => {
    if (!activeRpcUrl) return;
    setIsLoadingBalance(true);
    try {
      const balance = await fetchWalletBalanceEth(address, activeRpcUrl);
      setWalletBalanceEth(balance.balanceEth);
    } catch {
      setWalletBalanceEth('0.00000');
    } finally {
      setIsLoadingBalance(false);
    }
  }, [activeRpcUrl]);

  // Handle Validate Address action
  const handleValidateAddress = () => {
    const res = validateEthereumAddress(addressInput);
    setValidationResult(res);

    if (res.isValid && res.normalizedAddress) {
      refreshWalletBalance(res.normalizedAddress);
    } else {
      setWalletBalanceEth(null);
    }
  };

  // Handle demo address selection
  const handleSelectSampleAddress = (addr: string) => {
    setAddressInput(addr);
    const res = validateEthereumAddress(addr);
    setValidationResult(res);
    if (res.isValid && res.normalizedAddress) {
      refreshWalletBalance(res.normalizedAddress);
    }
  };

  // Fetch Activity Action
  const handleFetchActivity = async () => {
    if (isLoadingActivity) return; // Prevent duplicate requests

    // Ensure validation succeeds first
    const currentValidation = validateEthereumAddress(addressInput);
    setValidationResult(currentValidation);

    if (!currentValidation.isValid || !currentValidation.normalizedAddress) {
      setActivityError(currentValidation.error || 'Please provide a valid Ethereum wallet address first.');
      return;
    }

    const targetAddress = currentValidation.normalizedAddress;
    setIsLoadingActivity(true);
    setActivityError(null);
    setActivitySuccessMessage(null);

    try {
      if (mode === 'INDEXER') {
        // MODE A: Explorer / Indexer API
        const result = await fetchAddressTransactionsFromIndexer(targetAddress);
        setRawTransactions(result.transactions);
        setActiveSourceLabel(result.dataSource);

        if (result.transactions.length === 0) {
          setActivitySuccessMessage(result.rawMessage || 'Query completed: No transaction records found for this address on Sepolia.');
        } else {
          setActivitySuccessMessage(`Successfully retrieved ${result.transactions.length} transactions from ${result.dataSource}.`);
        }
      } else {
        // MODE B: Supplied Dataset
        // Filter loaded dataset by the requested wallet address
        const filtered = filterDatasetByAddress(cachedDatasetTransactions, targetAddress);
        setRawTransactions(filtered);

        if (filtered.length === 0) {
          setActivitySuccessMessage(`Queried dataset: No transactions match address ${targetAddress.slice(0, 8)}...`);
        } else {
          setActivitySuccessMessage(`Successfully filtered ${filtered.length} matching transactions from dataset.`);
        }
      }

      // Also refresh live balance
      refreshWalletBalance(targetAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActivityError(msg);
      // Fallback proposal if indexer fails
      if (mode === 'INDEXER') {
        setActivityError(`${msg} Tip: You can switch to "Mode B — Supplied Dataset" to test with offline transactions.`);
      }
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Handle custom file upload (CSV or JSON)
  const handleUploadFile = async (file: File) => {
    setIsLoadingActivity(true);
    setActivityError(null);
    try {
      const text = await file.text();
      let parseResult;

      if (file.name.endsWith('.csv') || file.type.includes('csv')) {
        parseResult = parseCsvDataset(text, `Uploaded CSV (${file.name})`);
      } else {
        parseResult = parseJsonDataset(text, `Uploaded JSON (${file.name})`);
      }

      setCachedDatasetTransactions(parseResult.transactions);
      setDatasetMalformedRows(parseResult.malformedRecords);
      setActiveSourceLabel(parseResult.sourceLabel);

      if (parseResult.malformedRecords.length > 0) {
        setIsMalformedModalOpen(true);
      }

      // If address is already validated, filter immediately
      if (validationResult?.isValid && validationResult.normalizedAddress) {
        const filtered = filterDatasetByAddress(parseResult.transactions, validationResult.normalizedAddress);
        setRawTransactions(filtered);
        setActivitySuccessMessage(`Loaded ${parseResult.transactions.length} valid records from ${file.name}. Found ${filtered.length} matching queried address.`);
      } else {
        setActivitySuccessMessage(`Loaded ${parseResult.transactions.length} valid transactions from ${file.name}. Validate an address to view its activity.`);
      }
    } catch (err: unknown) {
      setActivityError(`Failed to process dataset file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Reset to Bundled Demo Dataset
  const handleLoadBundledSample = () => {
    const sample = getBundledSampleDataset();
    setCachedDatasetTransactions(sample.transactions);
    setDatasetMalformedRows([]);
    setActiveSourceLabel(sample.sourceLabel);

    if (validationResult?.isValid && validationResult.normalizedAddress) {
      const filtered = filterDatasetByAddress(sample.transactions, validationResult.normalizedAddress);
      setRawTransactions(filtered);
    }
    setActivitySuccessMessage('Reset to bundled demonstration dataset.');
  };

  // Filtered & Sorted Transactions
  const processedTransactions = useMemo(() => {
    return rawTransactions
      .filter((tx) => {
        // Direction filter
        if (selectedDirection !== 'ALL' && tx.direction !== selectedDirection) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchHash = tx.transactionHash.toLowerCase().includes(q);
          const matchFrom = tx.from.toLowerCase().includes(q);
          const matchTo = tx.to ? tx.to.toLowerCase().includes(q) : false;
          if (!matchHash && !matchFrom && !matchTo) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'NEWEST':
            return b.blockNumber - a.blockNumber;
          case 'OLDEST':
            return a.blockNumber - b.blockNumber;
          case 'VALUE_HIGH':
            return Number(BigInt(b.valueWei) - BigInt(a.valueWei));
          case 'VALUE_LOW':
            return Number(BigInt(a.valueWei) - BigInt(b.valueWei));
          default:
            return 0;
        }
      });
  }, [rawTransactions, selectedDirection, searchQuery, sortBy]);

  // Compute summary stats from rawTransactions
  const summaryStats: TransactionSummaryStats | null = useMemo(() => {
    if (rawTransactions.length === 0) return null;
    return calculateTransactionSummary(rawTransactions);
  }, [rawTransactions]);

  return (
    <div className="app-container">
      {/* 1. Header with Network Status Indicator */}
      <Header
        networkInfo={networkInfo}
        isConnecting={isConnectingRpc}
        connectionError={rpcError}
        onRefreshNetwork={() => verifyRpcConnection(activeRpcUrl)}
        onOpenRpcConfig={() => setIsRpcModalOpen(true)}
      />

      {/* Network Alert if connection failed */}
      {rpcError && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Sepolia RPC Connection Warning:</strong> {rpcError}
            </div>
          </div>
          <button
            onClick={() => setIsRpcModalOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Switch RPC Endpoint
          </button>
        </div>
      )}

      {/* 2. Wallet Address Validation Card */}
      <WalletInput
        addressInput={addressInput}
        setAddressInput={setAddressInput}
        validationResult={validationResult}
        onValidate={handleValidateAddress}
        onSelectSampleAddress={handleSelectSampleAddress}
        balanceEth={walletBalanceEth}
        isLoadingBalance={isLoadingBalance}
      />

      {/* 3. Transaction Activity Data Source Selector */}
      <DataSourceSelector
        mode={mode}
        setMode={setMode}
        onFetchActivity={handleFetchActivity}
        isLoading={isLoadingActivity}
        canFetch={Boolean(validationResult?.isValid)}
        activeSourceLabel={activeSourceLabel}
        onUploadFile={handleUploadFile}
        onLoadBundledSample={handleLoadBundledSample}
      />

      {/* Activity Error Banner */}
      {activityError && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{activityError}</span>
        </div>
      )}

      {/* Activity Success Banner */}
      {activitySuccessMessage && !activityError && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{activitySuccessMessage}</span>
          </div>

          {datasetMalformedRows.length > 0 && (
            <button
              onClick={() => setIsMalformedModalOpen(true)}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertTriangle size={13} />
              <span>{datasetMalformedRows.length} Malformed Rows Reported</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Stats Summary Cards */}
      <StatsCards
        stats={summaryStats}
        balanceEth={walletBalanceEth}
        activeDataSource={activeSourceLabel}
      />

      {/* 5. Filters and Search Bar */}
      {rawTransactions.length > 0 && (
        <TransactionFilters
          selectedDirection={selectedDirection}
          setSelectedDirection={setSelectedDirection}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalFiltered={processedTransactions.length}
          totalAvailable={rawTransactions.length}
        />
      )}

      {/* 6. Transaction Activity Table */}
      <TransactionTable
        transactions={processedTransactions}
        isLoading={isLoadingActivity}
        queriedAddress={validationResult?.normalizedAddress || ''}
      />

      {/* RPC Configuration Modal */}
      <RpcConfigModal
        isOpen={isRpcModalOpen}
        currentRpc={activeRpcUrl}
        onClose={() => setIsRpcModalOpen(false)}
        onApplyRpc={verifyRpcConnection}
      />

      {/* Malformed Dataset Records Modal */}
      <MalformedRecordsModal
        isOpen={isMalformedModalOpen}
        onClose={() => setIsMalformedModalOpen(false)}
        reports={datasetMalformedRows}
        sourceLabel={activeSourceLabel}
      />
    </div>
  );
};

export default App;
