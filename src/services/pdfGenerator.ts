import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PdfReportOptions } from '../types/filters';

/**
 * Generates and downloads a comprehensive, production-grade PDF report
 * of the filtered wallet transaction activity using jsPDF and jspdf-autotable.
 */
export function generateWalletActivityPdf(options: PdfReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let currentY = margin;

  const primaryColor = [14, 116, 144]; // Deep Cyan

  // Helper for formatted timestamp
  const formatTs = (ts: number | null): string => {
    if (!ts) return 'Unavailable';
    const d = new Date(ts * 1000);
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  };

  const reportGenerationTime = new Date().toUTCString();

  // ==========================================
  // SECTION A: REPORT HEADER
  // ==========================================
  doc.setFillColor(15, 23, 42); // Dark slate header banner
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Blockchain Wallet Activity Report', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${reportGenerationTime}`, margin, 54);
  doc.text('Ethereum Sepolia Testnet • Chain ID: 11155111', margin, 68);

  currentY = 105;

  // Metadata Card Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 130, textColor: [71, 85, 105] },
      1: { cellWidth: 'auto', font: 'courier' }
    },
    body: [
      ['Queried Wallet Address:', options.walletAddress],
      ['Data Source:', options.dataSource + (options.datasetFilename ? ` (${options.datasetFilename})` : '')],
      ['Source Type:', options.isSuppliedDataset ? 'Mode B — Supplied / Imported Dataset' : 'Mode A — Live Sepolia Explorer / Indexer API'],
      ['Retrieval Status:', options.dataRetrievalStatus || 'Completed Successfully']
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // ==========================================
  // SECTION B: ORIGINAL QUERY TEXT
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. User Query & Audit Intent', margin, currentY);
  currentY += 12;

  const queryText = options.userQueryText.trim()
    ? options.userQueryText.trim()
    : '(No custom query text provided - standard filtered audit request)';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 34, 4, 4, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(`"${queryText}"`, pageWidth - margin * 2 - 20), margin + 10, currentY + 16);

  currentY += 46;

  // ==========================================
  // SECTION C: APPLIED FILTERS
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. Filter Configuration', margin, currentY);
  currentY += 8;

  const f = options.appliedFilters;
  const directionDesc = f.direction === 'ALL' ? 'All Directions (Filter Inactive)' : `${f.direction} Only (Active)`;
  const amountDesc = (f.minAmountEth.trim() || f.maxAmountEth.trim())
    ? `From ${f.minAmountEth.trim() || '0'} ETH to ${f.maxAmountEth.trim() || '∞'} ETH (Inclusive, Active)`
    : 'No Amount Boundary (Filter Inactive)';
  const blockDesc = (f.minBlock.trim() || f.maxBlock.trim())
    ? `Blocks #${f.minBlock.trim() || '0'} to #${f.maxBlock.trim() || 'Latest'} (Inclusive, Active)`
    : 'No Block Boundary (Filter Inactive)';
  const searchDesc = f.searchQuery.trim() ? `"${f.searchQuery.trim()}" (Active)` : 'None (Filter Inactive)';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, lineColor: [226, 232, 240] },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
    head: [['Filter Parameter', 'Configured Value / Criteria', 'Status']],
    body: [
      ['Transaction Direction', directionDesc, f.direction !== 'ALL' ? 'ACTIVE' : 'INACTIVE'],
      ['ETH Amount Range', amountDesc, (f.minAmountEth.trim() || f.maxAmountEth.trim()) ? 'ACTIVE' : 'INACTIVE'],
      ['Block Height Range', blockDesc, (f.minBlock.trim() || f.maxBlock.trim()) ? 'ACTIVE' : 'INACTIVE'],
      ['Text Search Match', searchDesc, f.searchQuery.trim() ? 'ACTIVE' : 'INACTIVE']
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // ==========================================
  // SECTION D: SUMMARY METRICS
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. Summary Metrics (Exact Integer Calculation)', margin, currentY);
  currentY += 8;

  const s = options.summary;
  const blockRangeText = s.minBlock !== null && s.maxBlock !== null
    ? `#${s.minBlock} - #${s.maxBlock}`
    : 'N/A';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, lineColor: [226, 232, 240] },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
    head: [['Metric Description', 'Value', 'Notes / Single-Count Rule']],
    body: [
      ['Total Retrieved Records', String(s.totalRetrieved), 'Original dataset / query volume before filtering'],
      ['Total Matching Records', String(s.totalMatching), 'Records matching all active filter criteria'],
      ['Incoming Transactions', String(s.incomingCount), `Total Value: +${s.totalReceivedEth} ETH`],
      ['Outgoing Transactions', String(s.outgoingCount), `Total Value: -${s.totalSentEth} ETH`],
      ['Self-Transfers', String(s.selfTransferCount), 'Single-counted; does not inflate incoming/outgoing'],
      ['Unknown-Direction Records', String(s.unknownCount), 'Excluded when a directional filter is active'],
      ['Matching Block Range', blockRangeText, 'Span of block heights among matching records']
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('* Note: ETH value sums represent transaction volume totals, not net wallet profit or current wallet balance.', margin, currentY);
  currentY += 14;

  // ==========================================
  // SECTION E: MATCHING TRANSACTIONS TABLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`4. Matching Transaction Records (${options.matchingTransactions.length})`, margin, currentY);
  currentY += 8;

  const tableBody = options.matchingTransactions.map((tx, idx) => {
    const shortHash = `${tx.transactionHash.slice(0, 10)}...${tx.transactionHash.slice(-8)}`;
    const fromStr = tx.from ? `${tx.from.slice(0, 8)}...${tx.from.slice(-6)}` : 'Unavailable';
    const toStr = tx.isContractCreation || !tx.to
      ? 'Contract Creation'
      : `${tx.to.slice(0, 8)}...${tx.to.slice(-6)}`;

    return [
      String(idx + 1),
      shortHash,
      tx.blockNumber ? `#${tx.blockNumber}` : 'Unavailable',
      formatTs(tx.timestamp),
      fromStr,
      toStr,
      `${tx.valueEth} ETH`,
      tx.direction,
      tx.status || 'Unavailable'
    ];
  });

  if (tableBody.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 8, halign: 'center', textColor: [100, 116, 139] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      head: [['#', 'Transaction Hash', 'Block', 'Timestamp', 'From', 'To', 'Amount (ETH)', 'Direction', 'Status']],
      body: [
        [{ content: 'No matching transactions found for the specified filters and wallet address.', colSpan: 9 }]
      ]
    });
  } else {
    autoTable(doc, {
      startY: currentY,
      tableWidth: pageWidth - margin * 2,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        textColor: [30, 41, 59],
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { font: 'courier' },
        2: { halign: 'right' },
        3: {},
        4: { font: 'courier' },
        5: { font: 'courier' },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'center' },
        8: { halign: 'center' }
      },
      head: [['#', 'Tx Hash', 'Block', 'Date (UTC)', 'From', 'To', 'Amount', 'Direction', 'Status']],
      body: tableBody
    });
  }

  // ==========================================
  // SECTION F: TRANSPARENCY DISCLAIMER & FOOTER
  // ==========================================
  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Disclaimer on final page
    if (i === totalPages) {
      const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 60;
      const disclaimerY = Math.min(finalY + 16, pageHeight - 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);

      const disclaimer = options.isSuppliedDataset
        ? 'DATA SOURCE TRANSPARENCY: This report was compiled from an imported transaction dataset. It reflects the imported file records only and makes no claim of independent blockchain validation. This report does not represent an official financial balance sheet.'
        : 'DATA SOURCE TRANSPARENCY: This report was compiled via live Ethereum Sepolia Explorer / Indexer API records. It reflects confirmed block transactions matching the specified filter criteria and does not constitute a full state balance statement.';

      doc.text(doc.splitTextToSize(disclaimer, pageWidth - margin * 2), margin, disclaimerY);
    }

    // Page number footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Blockchain Wallet Activity Assistant • Page ${i} of ${totalPages}`, margin, pageHeight - 20);
    doc.text(`Sepolia Chain ID: 11155111 • ${reportGenerationTime}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  return doc;
}

/**
 * Convenience function to trigger an immediate browser PDF download.
 */
export function downloadWalletActivityPdf(options: PdfReportOptions, filename?: string): void {
  const doc = generateWalletActivityPdf(options);
  const cleanAddress = options.walletAddress ? options.walletAddress.slice(0, 8) : 'wallet';
  const name = filename || `wallet-activity-report-${cleanAddress}-${Date.now()}.pdf`;
  doc.save(name);
}
