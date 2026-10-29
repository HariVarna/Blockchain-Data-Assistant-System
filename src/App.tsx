import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  NetworkInfo,
  NormalizedTransaction,
  WalletValidationResult,
  DataSourceMode,
  MalformedRecordReport
} from './types/transaction';
import {
  TransactionFilterState,
  FilterValidationErrors,
  DetailedTransactionSummary,
  PdfReportOptions
} from './types/filters';
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
  filterDatasetByAddress
} from './services/dataset';
import {
  applyTransactionFilters,
  validateFilterInputs,
  calculateDetailedSummary
} from './services/filterService';
import { downloadWalletActivityPdf } from './services/pdfGenerator';

import { Header } from './components/Header';
import { WalletInput } from './components/WalletInput';
import { DataSourceSelector } from './components/DataSourceSelector';
import { StatsCards } from './components/StatsCards';
import { FilterControls } from './components/FilterControls';
import { TransactionTable } from './components/TransactionTable';
import { RpcConfigModal } from './components/RpcConfigModal';
import { MalformedRecordsModal } from './components/MalformedRecordsModal';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const INITIAL_FILTERS: TransactionFilterState = {
  direction: 'ALL',
  minAmountEth: '',
  maxAmountEth: '',
  minBlock: '',
  maxBlock: '',
  searchQuery: '',
  userQueryText: ''
};

export const App: React.FC = () => {
  // RPC & Network State
  const [activeRpcUrl, setActiveRpcUrl] = useState<string>(DEFAULT_SEPOLIA_RPC_URLS[0]);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isConnectingRpc, setIsConnectingRpc] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [isRpcModalOpen, setIsRpcModalOpen] = useState(false);

  // Wallet Address State
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
  const [activeDatasetFilename, setActiveDatasetFilename] = useState<string | undefined>(undefined);

  // Dataset specific state
  const [cachedDatasetTransactions, setCachedDatasetTransactions] = useState<NormalizedTransaction[]>([]);
  const [datasetMalformedRows, setDatasetMalformedRows] = useState<MalformedRecordReport[]>([]);
  const [isMalformedModalOpen, setIsMalformedModalOpen] = useState(false);

  // Filter State (Interactive form state vs applied filter state)
  const [filterForm, setFilterForm] = useState<TransactionFilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilterState>(INITIAL_FILTERS);
  const [filterErrors, setFilterErrors] = useState<FilterValidationErrors>({
    amountError: null,
    blockError: null
  });

  // PDF Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);

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
    setActiveDatasetFilename('sampleTransactions.json');
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
        const result = await fetchAddressTransactionsFromIndexer(targetAddress);
        setRawTransactions(result.transactions);
        setActiveSourceLabel(result.dataSource);
        setActiveDatasetFilename(undefined);

        if (result.transactions.length === 0) {
          setActivitySuccessMessage(result.rawMessage || 'Query completed: No transaction records found for this address on Sepolia.');
        } else {
          setActivitySuccessMessage(`Successfully retrieved ${result.transactions.length} transactions from ${result.dataSource}.`);
        }
      } else {
        const filtered = filterDatasetByAddress(cachedDatasetTransactions, targetAddress);
        setRawTransactions(filtered);

        if (filtered.length === 0) {
          setActivitySuccessMessage(`Queried dataset: No transactions match address ${targetAddress.slice(0, 8)}...`);
        } else {
          setActivitySuccessMessage(`Successfully filtered ${filtered.length} matching transactions from dataset.`);
        }
      }

      refreshWalletBalance(targetAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActivityError(msg);
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
      setActiveDatasetFilename(file.name);

      if (parseResult.malformedRecords.length > 0) {
        setIsMalformedModalOpen(true);
      }

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
    setActiveDatasetFilename('sampleTransactions.json');

    if (validationResult?.isValid && validationResult.normalizedAddress) {
      const filtered = filterDatasetByAddress(sample.transactions, validationResult.normalizedAddress);
      setRawTransactions(filtered);
    }
    setActivitySuccessMessage('Reset to bundled demonstration dataset.');
  };

  // Filter Actions: Apply Filters (Client-side, NO blockchain requests!)
  const handleApplyFilters = () => {
    const validation = validateFilterInputs(filterForm);
    setFilterErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    setAppliedFilters(filterForm);
  };

  // Filter Actions: Reset Filters
  const handleResetFilters = () => {
    setFilterForm((prev) => ({
      ...INITIAL_FILTERS,
      userQueryText: prev.userQueryText // Preserve query text
    }));
    setAppliedFilters((prev) => ({
      ...INITIAL_FILTERS,
      userQueryText: prev.userQueryText
    }));
    setFilterErrors({ amountError: null, blockError: null });
  };

  // Filter Actions: Clear Results
  const handleClearResults = () => {
    setRawTransactions([]);
    setActivitySuccessMessage(null);
    setActivityError(null);
  };

  // Filtered & Sorted Transactions (Deterministic: Block desc, Hash asc)
  const matchingTransactions = useMemo(() => {
    return applyTransactionFilters(rawTransactions, appliedFilters);
  }, [rawTransactions, appliedFilters]);

  // Detailed Summary (Exact integer arithmetic for Wei amounts)
  const detailedSummary: DetailedTransactionSummary | null = useMemo(() => {
    if (rawTransactions.length === 0) return null;
    return calculateDetailedSummary(matchingTransactions, rawTransactions.length);
  }, [rawTransactions, matchingTransactions]);

  // Export PDF Report Action
  const handleExportPdf = () => {
    if (!validationResult?.normalizedAddress || !detailedSummary) return;

    setIsExportingPdf(true);
    setPdfExportSuccess(false);

    try {
      const options: PdfReportOptions = {
        walletAddress: validationResult.normalizedAddress,
        networkName: networkInfo?.name || 'Ethereum Sepolia',
        chainId: networkInfo?.chainId || 11155111,
        dataSource: activeSourceLabel,
        dataRetrievalStatus: activitySuccessMessage || 'Completed',
        userQueryText: appliedFilters.userQueryText || filterForm.userQueryText || '',
        appliedFilters,
        allTransactions: rawTransactions,
        matchingTransactions,
        summary: detailedSummary,
        datasetFilename: activeDatasetFilename,
        isSuppliedDataset: mode === 'DATASET'
      };

      downloadWalletActivityPdf(options);
      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 5000);
    } catch (err: unknown) {
      setActivityError(`Failed to generate PDF report: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

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

      {/* 4. Full Transaction Filtering & PDF Report Controls */}
      <FilterControls
        filters={filterForm}
        setFilters={setFilterForm}
        filterErrors={filterErrors}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onClearResults={handleClearResults}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
        canExportPdf={Boolean(validationResult?.isValid && rawTransactions.length > 0)}
        totalMatching={matchingTransactions.length}
        totalRetrieved={rawTransactions.length}
        pdfExportSuccess={pdfExportSuccess}
      />

      {/* 5. Summary Statistics Cards */}
      <StatsCards
        summary={detailedSummary}
        balanceEth={walletBalanceEth}
        activeDataSource={activeSourceLabel}
      />

      {/* 6. Transaction Activity Table */}
      <TransactionTable
        transactions={matchingTransactions}
        isLoading={isLoadingActivity}
        queriedAddress={validationResult?.normalizedAddress || ''}
      />

      {/* Modals */}
      <RpcConfigModal
        isOpen={isRpcModalOpen}
        currentRpc={activeRpcUrl}
        onClose={() => setIsRpcModalOpen(false)}
        onApplyRpc={verifyRpcConnection}
      />

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
