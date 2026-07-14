import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import { Transaction, BillingRecord } from '../types';

// ─── Platform-aware file share ────────────────────────────────────────────────

async function shareFile(base64: string, filename: string, mimeType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    const FS = await import('expo-file-system');
    const Sharing = await import('expo-sharing');
    const uri = (FS.cacheDirectory ?? '') + filename;
    await FS.writeAsStringAsync(uri, base64, { encoding: FS.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: `Share ${filename}` });
  }
}

function safeFilename(label: string): string {
  return label.replace(/[^a-zA-Z0-9]/g, '_');
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function exportTransactionsExcel(
  transactions: Transaction[],
  periodLabel: string
): Promise<void> {
  const data = transactions.map((t) => ({
    Date: t.date,
    'Flat No': t.flatNumber,
    'Resident Name': t.residentName,
    Type: t.direction === 'credit' ? 'Payment Received' : 'Bill Generated',
    'Amount (₹)': t.amount.toFixed(2),
    Remarks: t.remarks,
  }));

  const creditTotal = transactions.filter((t) => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const debitTotal = transactions.filter((t) => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);

  data.push({} as any);
  data.push({ Date: '', 'Flat No': '', 'Resident Name': '── SUMMARY ──', Type: '', 'Amount (₹)': '', Remarks: '' });
  data.push({ Date: '', 'Flat No': '', 'Resident Name': 'Total Received', Type: '', 'Amount (₹)': creditTotal.toFixed(2), Remarks: '' });
  data.push({ Date: '', 'Flat No': '', 'Resident Name': 'Total Billed', Type: '', 'Amount (₹)': debitTotal.toFixed(2), Remarks: '' });
  data.push({ Date: '', 'Flat No': '', 'Resident Name': 'Balance', Type: '', 'Amount (₹)': (creditTotal - debitTotal).toFixed(2), Remarks: '' });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 32 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  await shareFile(
    base64,
    `transactions_${safeFilename(periodLabel)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export async function exportTransactionsWord(
  transactions: Transaction[],
  periodLabel: string
): Promise<void> {
  const creditTotal = transactions.filter((t) => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const debitTotal = transactions.filter((t) => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);
  const balance = creditTotal - debitTotal;

  const rows = transactions
    .map(
      (t) => `
    <tr>
      <td>${t.date}</td>
      <td>${t.flatNumber}</td>
      <td>${t.residentName}</td>
      <td style="color:${t.direction === 'credit' ? '#2E7D32' : '#C62828'}">${t.direction === 'credit' ? 'Payment' : 'Bill'}</td>
      <td style="text-align:right">₹${t.amount.toFixed(2)}</td>
      <td>${t.remarks}</td>
    </tr>`
    )
    .join('');

  const html = wordHtml(`
    <h1 style="color:#1565C0">Water Bill Manager</h1>
    <h2>Transaction Report — ${periodLabel}</h2>
    <p style="color:#666;font-size:10pt">Generated: ${new Date().toLocaleDateString('en-IN')}</p>
    <table>
      <thead><tr>
        <th>Date</th><th>Flat No</th><th>Resident</th><th>Type</th><th style="text-align:right">Amount</th><th>Remarks</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#999">No transactions in this period</td></tr>'}</tbody>
    </table>
    <div class="summary">
      <table style="background:transparent;margin:0;border:none">
        <tr><td>Total Received</td><td style="text-align:right;color:#2E7D32;font-weight:bold">₹${creditTotal.toFixed(2)}</td></tr>
        <tr><td>Total Billed</td><td style="text-align:right;color:#C62828;font-weight:bold">₹${debitTotal.toFixed(2)}</td></tr>
        <tr><td><b>Balance</b></td><td style="text-align:right;font-weight:bold;color:${balance >= 0 ? '#2E7D32' : '#C62828'}">₹${balance.toFixed(2)}</td></tr>
      </table>
    </div>
  `);

  const base64 = btoa(unescape(encodeURIComponent(html)));
  await shareFile(base64, `transactions_${safeFilename(periodLabel)}.doc`, 'application/msword');
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export interface AccountRow {
  flat: { flatNumber: string; residentName: string; id: string };
  balance: number;
  credit: number;
  debit: number;
}

export async function exportAccountsExcel(rows: AccountRow[]): Promise<void> {
  const data = rows.map((r) => ({
    'Flat No': r.flat.flatNumber,
    'Resident Name': r.flat.residentName,
    'Total Billed (₹)': r.debit.toFixed(2),
    'Total Received (₹)': r.credit.toFixed(2),
    'Balance (₹)': r.balance.toFixed(2),
    Status: r.balance === 0 ? 'Settled' : r.balance > 0 ? 'Overpaid' : 'Due',
  }));

  const totalBilled = rows.reduce((s, r) => s + r.debit, 0);
  const totalReceived = rows.reduce((s, r) => s + r.credit, 0);

  data.push({} as any);
  data.push({
    'Flat No': 'TOTAL',
    'Resident Name': '',
    'Total Billed (₹)': totalBilled.toFixed(2),
    'Total Received (₹)': totalReceived.toFixed(2),
    'Balance (₹)': (totalReceived - totalBilled).toFixed(2),
    Status: '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 10 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Accounts');

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const date = new Date().toISOString().slice(0, 10);
  await shareFile(base64, `accounts_${date}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function exportAccountsWord(rows: AccountRow[]): Promise<void> {
  const totalBilled = rows.reduce((s, r) => s + r.debit, 0);
  const totalReceived = rows.reduce((s, r) => s + r.credit, 0);
  const totalBalance = totalReceived - totalBilled;

  const tableRows = rows
    .map((r) => {
      const status = r.balance === 0 ? 'Settled' : r.balance > 0 ? 'Overpaid' : 'Due';
      const statusColor = r.balance === 0 ? '#2E7D32' : r.balance > 0 ? '#1565C0' : '#C62828';
      return `
      <tr>
        <td>${r.flat.flatNumber}</td>
        <td>${r.flat.residentName}</td>
        <td style="text-align:right">₹${r.debit.toFixed(2)}</td>
        <td style="text-align:right">₹${r.credit.toFixed(2)}</td>
        <td style="text-align:right;color:${r.balance >= 0 ? '#2E7D32' : '#C62828'}">₹${r.balance.toFixed(2)}</td>
        <td style="color:${statusColor};font-weight:bold">${status}</td>
      </tr>`;
    })
    .join('');

  const html = wordHtml(`
    <h1 style="color:#1565C0">Water Bill Manager</h1>
    <h2>Accounts Summary</h2>
    <p style="color:#666;font-size:10pt">As of: ${new Date().toLocaleDateString('en-IN')}</p>
    <table>
      <thead><tr>
        <th>Flat</th><th>Resident</th>
        <th style="text-align:right">Billed</th>
        <th style="text-align:right">Received</th>
        <th style="text-align:right">Balance</th>
        <th>Status</th>
      </tr></thead>
      <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;color:#999">No data</td></tr>'}</tbody>
    </table>
    <div class="summary">
      <table style="background:transparent;margin:0;border:none">
        <tr><td>Total Billed</td><td style="text-align:right;color:#C62828;font-weight:bold">₹${totalBilled.toFixed(2)}</td></tr>
        <tr><td>Total Received</td><td style="text-align:right;color:#2E7D32;font-weight:bold">₹${totalReceived.toFixed(2)}</td></tr>
        <tr><td><b>Net Balance</b></td><td style="text-align:right;font-weight:bold;color:${totalBalance >= 0 ? '#2E7D32' : '#C62828'}">₹${totalBalance.toFixed(2)}</td></tr>
      </table>
    </div>
  `);

  const base64 = btoa(unescape(encodeURIComponent(html)));
  const date = new Date().toISOString().slice(0, 10);
  await shareFile(base64, `accounts_${date}.doc`, 'application/msword');
}

// ─── Billing History ─────────────────────────────────────────────────────────

export async function exportHistoryExcel(
  records: BillingRecord[],
  periodLabel: string
): Promise<void> {
  const data = records.map((r) => ({
    Month: r.billingMonth,
    'Flat No': r.flatNumber,
    'Resident Name': r.residentName,
    'Prev Reading': r.previousReading,
    'New Reading': r.newReading,
    'Units Consumed': r.unitsConsumed,
    'Adjustment': r.adjustmentUnits,
    'Total Units': r.totalUnits,
    'Rate (₹/unit)': r.multiplier,
    'Fixed Charge (₹)': r.offset,
    'Total Amount (₹)': r.totalBillAmount.toFixed(2),
  }));

  const grandTotal = records.reduce((s, r) => s + r.totalBillAmount, 0);
  data.push({} as any);
  data.push({
    Month: 'TOTAL', 'Flat No': `${records.length} bills`, 'Resident Name': '',
    'Prev Reading': 0, 'New Reading': 0, 'Units Consumed': 0, 'Adjustment': 0,
    'Total Units': records.reduce((s, r) => s + r.totalUnits, 0),
    'Rate (₹/unit)': 0, 'Fixed Charge (₹)': 0,
    'Total Amount (₹)': grandTotal.toFixed(2),
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Billing History');

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  await shareFile(base64, `history_${safeFilename(periodLabel)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function exportHistoryWord(
  records: BillingRecord[],
  periodLabel: string
): Promise<void> {
  const grandTotal = records.reduce((s, r) => s + r.totalBillAmount, 0);

  const rows = records.map((r) => `
    <tr>
      <td>${r.billingMonth}</td>
      <td>${r.flatNumber}</td>
      <td>${r.residentName}</td>
      <td style="text-align:right">${r.previousReading}</td>
      <td style="text-align:right">${r.newReading}</td>
      <td style="text-align:right">${r.totalUnits}</td>
      <td style="text-align:right">₹${r.totalBillAmount.toFixed(2)}</td>
    </tr>`).join('');

  const html = wordHtml(`
    <h1 style="color:#1565C0">Water Bill Manager</h1>
    <h2>Billing History — ${periodLabel}</h2>
    <p style="color:#666;font-size:10pt">Generated: ${new Date().toLocaleDateString('en-IN')} · ${records.length} records</p>
    <table>
      <thead><tr>
        <th>Month</th><th>Flat</th><th>Resident</th>
        <th style="text-align:right">Prev</th>
        <th style="text-align:right">New</th>
        <th style="text-align:right">Units</th>
        <th style="text-align:right">Amount</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#999">No records</td></tr>'}</tbody>
    </table>
    <div class="summary">
      <table style="background:transparent;margin:0;border:none">
        <tr><td>Total Bills</td><td style="text-align:right;font-weight:bold">${records.length}</td></tr>
        <tr><td>Total Units</td><td style="text-align:right;font-weight:bold">${records.reduce((s, r) => s + r.totalUnits, 0)}</td></tr>
        <tr><td><b>Grand Total</b></td><td style="text-align:right;font-weight:bold;color:#1565C0">₹${grandTotal.toFixed(2)}</td></tr>
      </table>
    </div>
  `);

  const base64 = btoa(unescape(encodeURIComponent(html)));
  await shareFile(base64, `history_${safeFilename(periodLabel)}.doc`, 'application/msword');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wordHtml(body: string): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
               xmlns:w="urn:schemas-microsoft-com:office:word"
               xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="utf-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 24px; color: #212121; }
    h1 { font-size: 18pt; margin-bottom: 2px; }
    h2 { font-size: 13pt; color: #555; margin-top: 4px; }
    table { border-collapse: collapse; width: 100%; margin-top: 14px; }
    th { background: #1565C0; color: #fff; padding: 8px 10px; text-align: left; font-size: 10pt; }
    td { padding: 7px 10px; border-bottom: 1px solid #E0E0E0; font-size: 10pt; }
    tr:nth-child(even) td { background: #F5F7FA; }
    .summary { margin-top: 18px; padding: 14px 18px; background: #E3F2FD; }
  </style>
  </head>
  <body>${body}</body>
  </html>`;
}
