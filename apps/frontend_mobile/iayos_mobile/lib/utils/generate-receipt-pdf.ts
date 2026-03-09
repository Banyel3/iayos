import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { readAsStringAsync } from 'expo-file-system/legacy'; // Fix for deprecation error

const BRAND_COLOR = '#007AFF';

function formatCurrencyPdf(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDatePdf(dateString: string): string {
  return new Date(dateString).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PDF_STYLES = `
  body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 3px solid ${BRAND_COLOR}; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 28px; font-weight: bold; color: ${BRAND_COLOR}; }
  .receipt-title { font-size: 16px; color: #666; margin-top: 4px; }
  .amount-block { text-align: center; margin: 24px 0; }
  .amount { font-size: 42px; font-weight: bold; color: #1a1a1a; }
  .amount-label { font-size: 14px; color: #666; margin-bottom: 4px; }
  .section-header { font-size: 13px; font-weight: bold; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
  td:first-child { color: #666; width: 45%; }
  td:last-child { font-weight: 600; text-align: right; }
  .total-row td { font-size: 16px; font-weight: bold; border-top: 2px solid #1a1a1a; }
  .party-block { background: #f9f9f9; border-radius: 8px; padding: 12px; margin: 8px 0; }
  .party-name { font-size: 16px; font-weight: bold; }
  .party-label { font-size: 12px; color: #999; }
  .status-completed { color: #16a34a; }
  .status-pending { color: #d97706; }
  .status-failed { color: #dc2626; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
`;

const DEPOSIT_RECEIPT_STYLES = `
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    padding: 40px;
    color: #000;
    max-width: 800px;
    margin: 0 auto;
    font-size: 14px;
  }
  .header-table {
    width: 100%;
    margin-bottom: 20px;
  }
  .logo-cell {
    text-align: left;
    vertical-align: top;
  }
  .address-cell {
    text-align: right;
    vertical-align: top;
    font-size: 12px;
    line-height: 1.4;
  }
  .logo-text {
    font-size: 36px;
    font-weight: bold;
    color: #54B7EC; /* Brand Blue */
    letter-spacing: -1px;
  }
  .company-name {
    font-weight: bold;
  }

  .title-container {
    text-align: center;
    margin-bottom: 30px;
  }
  .receipt-title {
    font-size: 28px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .content-table {
    width: 100%;
    border-collapse: collapse;
  }
  .section-header {
    font-size: 13px;
    font-weight: bold;
    text-transform: uppercase;
    padding-bottom: 8px;
    padding-top: 16px;
  }
  
  .details-row td {
    padding-bottom: 4px;
    vertical-align: top;
    font-size: 14px;
  }
  .details-label {
    width: 140px;
  }
  .details-value {
    /* value column */
  }

  .amount-section {
    margin-top: 40px;
    margin-bottom: 20px;
  }
  .amount-table {
    width: 100%;
  }
  .amount-label {
    font-size: 24px;
  }
  .amount-value {
    font-size: 24px;
    font-weight: bold;
    text-align: right;
  }
  .balance-label {
    font-size: 14px;
  }
  .balance-value {
    font-size: 14px;
    text-align: right;
  }

  .payment-method {
    margin-top: 40px;
    font-size: 14px;
    font-family: monospace;
  }

  .footer {
    position: absolute;
    bottom: 40px;
    left: 40px;
    right: 40px;
    text-align: center;
    border-top: 1px solid #eee;
    padding-top: 20px;
  }
  .disclaimer {
    font-size: 10px;
    color: #ccc;
    line-height: 1.4;
    margin: 0 auto;
    max-width: 80%;
  }
`;

export interface DepositReceiptData {
  transaction_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  transaction_type_label?: string;
  reference_number?: string | null;
  paymongo_payment_id?: string | null;
  balance_after?: number | null;
  job?: { id: number; title: string } | null;
}

export async function downloadDepositReceiptPdf(transaction: DepositReceiptData): Promise<void> {
  const logoAsset = Asset.fromModule(require('../../assets/logo.png'));
  await logoAsset.downloadAsync();
  const logoBase64 = await readAsStringAsync(logoAsset.localUri ?? logoAsset.uri, {
    encoding: 'base64',
  });
  const logoSrc = `data:image/png;base64,${logoBase64}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>${DEPOSIT_RECEIPT_STYLES}</style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td class="logo-cell">
            <img src="${logoSrc}" style="width: 150px; height: auto;" />
          </td>
          <td class="address-cell">
            <div class="company-name">iAyos</div>
            <div>Pasabolong, City of Zamboanga</div>
            <div>Region IX (Zamboanga Peninsula)</div>
          </td>
        </tr>
      </table>

      <div class="title-container">
        <div class="receipt-title">RECEIPT</div>
      </div>

      <table class="content-table">
        <tr>
          <td colspan="2" class="section-header">TRANSACTION DETAILS</td>
        </tr>
        <tr class="details-row">
          <td class="details-label">Transaction ID:</td>
          <td class="details-value">${transaction.transaction_id}</td>
        </tr>
        ${transaction.reference_number ? `
        <tr class="details-row">
          <td class="details-label">Reference No.:</td>
          <td class="details-value">${transaction.reference_number}</td>
        </tr>` : ''}
        ${transaction.paymongo_payment_id ? `
        <tr class="details-row">
          <td class="details-label">PayMongo Ref.:</td>
          <td class="details-value">${transaction.paymongo_payment_id}</td>
        </tr>` : ''}
        <tr class="details-row">
          <td class="details-label">Date & Time:</td>
          <td class="details-value">${formatDatePdf(transaction.created_at)}</td>
        </tr>

        ${transaction.job ? `
        <tr>
          <td colspan="2" class="section-header">JOB DETAILS</td>
        </tr>
        <tr class="details-row">
          <td class="details-label">Job ID:</td>
          <td class="details-value">${transaction.job.id}</td>
        </tr>
        <tr class="details-row">
          <td class="details-label">Job Title:</td>
          <td class="details-value">${transaction.job.title}</td>
        </tr>
        ` : ''}
      </table>
      
      <div class="amount-section">
        <table class="amount-table">
          <tr>
            <td class="amount-label">Amount</td>
            <td class="amount-value">${formatCurrencyPdf(transaction.amount)}</td>
          </tr>
          ${transaction.balance_after != null ? `
          <tr>
            <td class="balance-label">Balance After</td>
            <td class="balance-value">${formatCurrencyPdf(transaction.balance_after)}</td>
          </tr>` : ''}
        </table>
      </div>

      <div class="payment-method">
        Payment Method: ${transaction.payment_method.toUpperCase()}
      </div>

      <div class="footer">
        <div class="disclaimer">
          <!-- Footer text removed as requested -->
        </div>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Save Receipt',
    UTI: 'com.adobe.pdf',
  });
}

export interface JobReceiptData {
  transaction_id?: string;
  completed_at?: string | null;
  job?: {
    id: number;
    title: string;
    job_type?: string;
    status?: string;
  } | null;
  payments?: {
    job_budget?: number;
    platform_fee?: number;
    total_paid?: number;
    worker_earnings?: number;
    escrow_amount?: number;
    remaining_payment?: number;
  } | null;
  client?: {
    name: string;
    email?: string;
  } | null;
  worker?: {
    name: string;
    email?: string;
  } | null;
}

export async function downloadJobReceiptPdf(
  receipt: JobReceiptData,
  userRole: 'CLIENT' | 'WORKER'
): Promise<void> {
  const isClient = userRole === 'CLIENT';
  const payments = receipt.payments || {};

  const paymentRows = isClient
    ? `
        <tr><td>Job Budget</td><td>${formatCurrencyPdf(payments.job_budget || 0)}</td></tr>
        ${payments.escrow_amount != null ? `<tr><td>Escrow (50%)</td><td>${formatCurrencyPdf(payments.escrow_amount)}</td></tr>` : ''}
        ${payments.remaining_payment != null ? `<tr><td>Remaining (50%)</td><td>${formatCurrencyPdf(payments.remaining_payment)}</td></tr>` : ''}
        <tr><td>Platform Fee</td><td>${formatCurrencyPdf(payments.platform_fee || 0)}</td></tr>
        <tr class="total-row"><td>Total Paid</td><td>${formatCurrencyPdf(payments.total_paid || 0)}</td></tr>
      `
    : `
        <tr><td>Job Budget</td><td>${formatCurrencyPdf(payments.job_budget || 0)}</td></tr>
        <tr><td>Platform Fee</td><td>-${formatCurrencyPdf(payments.platform_fee || 0)}</td></tr>
        <tr class="total-row"><td>Your Earnings</td><td>${formatCurrencyPdf(payments.worker_earnings || 0)}</td></tr>
      `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        ${PDF_STYLES}
        .job-title-block { text-align: center; margin: 16px 0 24px; }
        .job-title-text { font-size: 20px; font-weight: bold; }
        .job-id { font-size: 13px; color: #999; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">iAyos</div>
        <div class="receipt-title">Job Completion Receipt</div>
      </div>

      <div class="job-title-block">
        <div class="job-title-text">${receipt.job?.title || 'Job Receipt'}</div>
        ${receipt.job?.id ? `<div class="job-id">Job #${receipt.job.id}</div>` : ''}
      </div>

      <div class="section-header">Job Details</div>
      <table>
        ${receipt.job?.job_type ? `<tr><td>Type</td><td>${receipt.job.job_type}</td></tr>` : ''}
        ${receipt.job?.status ? `<tr><td>Status</td><td>${receipt.job.status}</td></tr>` : ''}
        ${receipt.completed_at ? `<tr><td>Completed</td><td>${formatDatePdf(receipt.completed_at)}</td></tr>` : ''}
        ${receipt.transaction_id ? `<tr><td>Transaction ID</td><td>${receipt.transaction_id}</td></tr>` : ''}
      </table>

      <div class="section-header">Payment Summary</div>
      <table>${paymentRows}</table>

      ${receipt.client ? `
        <div class="section-header">Client</div>
        <div class="party-block">
          <div class="party-name">${receipt.client.name}</div>
          ${receipt.client.email ? `<div class="party-label">${receipt.client.email}</div>` : ''}
        </div>
      ` : ''}

      ${receipt.worker ? `
        <div class="section-header">Worker</div>
        <div class="party-block">
          <div class="party-name">${receipt.worker.name}</div>
          ${receipt.worker.email ? `<div class="party-label">${receipt.worker.email}</div>` : ''}
        </div>
      ` : ''}

      <div class="footer">
        This receipt was generated by iAyos. For inquiries, contact support@iayos.com.<br/>
        iAyos acts as an escrow intermediary. This does not constitute an official BIR receipt.
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Save Receipt',
    UTI: 'com.adobe.pdf',
  });
}
