interface InvoiceParams {
  type: 'course' | 'workshop';
  productName: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  orderId: string;
  paymentId: string;
  originalPrice: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  date: string;
}

function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');
}

function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (amount === 0) return 'Zero Rupees Only';

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  result += ' Only';
  return result;
}

export function generateInvoiceHTML(params: InvoiceParams): string {
  const {
    type,
    productName,
    studentName,
    studentEmail,
    studentPhone,
    orderId,
    paymentId: _paymentId,
    originalPrice,
    discountAmount,
    finalAmount,
    status: _status,
    date,
  } = params;

  const invoiceDate = formatDate(date);
  const invoiceNumber = `INV-${orderId.replace('order_', '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase()}`;
  const hasDiscount = discountAmount > 0;
  const typeLabel = type === 'course' ? 'Course Enrollment' : 'Workshop Enrollment';
  const words = amountInWords(finalAmount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      font-size: 13px;
      line-height: 1.5;
    }

    .invoice-page {
      max-width: 790px;
      margin: 24px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 28px 32px 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-left {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .brand-logo {
      width: 52px;
      height: 52px;
      flex-shrink: 0;
    }

    .brand-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .brand-info {}

    .brand-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .brand-address {
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
      margin-top: 4px;
      max-width: 380px;
    }

    .brand-contact {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    .brand-contact strong {
      color: #334155;
    }

    .invoice-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    /* ── Bill To Section ── */
    .bill-section {
      display: flex;
      justify-content: space-between;
      padding: 24px 32px;
      border-bottom: 1px solid #e2e8f0;
    }

    .bill-left {}

    .bill-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .bill-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .bill-detail {
      font-size: 12px;
      color: #475569;
      line-height: 1.7;
    }

    .bill-right {
      text-align: right;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .meta-label {
      color: #94a3b8;
      font-weight: 500;
    }

    .meta-value {
      color: #0f172a;
      font-weight: 700;
    }

    /* ── Items Table ── */
    .items-section {
      padding: 0;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .items-table colgroup .col-sno { width: 8%; }
    .items-table colgroup .col-desc { width: 32%; }
    .items-table colgroup .col-qty { width: 10%; }
    .items-table colgroup .col-rate { width: 16%; }
    .items-table colgroup .col-amount { width: 16%; }
    .items-table colgroup .col-disc { width: 12%; }
    .items-table colgroup .col-total { width: 18%; }

    .items-table thead th {
      background: #f97316;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 10px;
      border: none;
    }

    .items-table thead th:first-child {
      text-align: center;
    }

    .items-table thead th:nth-child(2) {
      text-align: left;
    }

    .items-table thead th:nth-child(n+3) {
      text-align: right;
    }

    .items-table tbody td {
      padding: 14px 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
      color: #334155;
      vertical-align: middle;
    }

    .items-table tbody td:first-child {
      text-align: center;
      color: #64748b;
      font-weight: 500;
    }

    .items-table tbody td:nth-child(2) {
      text-align: left;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.5;
    }

    .items-table tbody td:nth-child(n+3) {
      text-align: right;
    }

    .items-table .type-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 4px;
      background: ${type === 'course' ? '#fff7ed' : '#fef3c7'};
      color: ${type === 'course' ? '#ea580c' : '#d97706'};
    }

    .items-table .discount-cell {
      color: #dc2626;
      font-weight: 600;
    }

    .items-table .total-row td {
      border-top: 2px solid #e2e8f0;
      border-bottom: none;
      font-weight: 700;
      color: #0f172a;
      padding: 12px 10px;
    }

    .items-table .total-row td:nth-child(2) {
      text-align: left;
    }

    .items-table .total-row td:nth-child(n+3) {
      text-align: right;
    }

    /* ── Summary ── */
    .summary-section {
      padding: 20px 32px;
      display: flex;
      justify-content: flex-end;
    }

    .summary-table {
      width: 280px;
      border-collapse: collapse;
    }

    .summary-table tr td {
      padding: 5px 0;
      font-size: 12px;
      color: #64748b;
    }

    .summary-table tr td:first-child {
      text-align: left;
    }

    .summary-table tr td:last-child {
      text-align: right;
      font-weight: 600;
      color: #334155;
    }

    .summary-table .discount-row td {
      color: #dc2626;
    }

    .summary-table .discount-row td:last-child {
      font-weight: 700;
    }

    .summary-table .total-final td {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      background: #f97316;
      padding: 10px 14px;
    }

    .summary-table .total-final td:first-child {
      text-align: left;
      border-radius: 6px 0 0 6px;
    }

    .summary-table .total-final td:last-child {
      text-align: right;
      border-radius: 0 6px 6px 0;
    }

    /* ── Amount in Words ── */
    .amount-words-section {
      padding: 0 32px 20px;
    }

    .amount-words-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 12px;
    }

    .amount-words-label {
      font-weight: 700;
      color: #0f172a;
    }

    .amount-words-value {
      color: #475569;
      font-weight: 500;
    }

    /* ── Footer ── */
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 20px 32px 28px;
      border-top: 1px solid #e2e8f0;
    }

    .terms-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .terms-list {
      list-style: none;
      padding: 0;
    }

    .terms-list li {
      font-size: 11px;
      color: #64748b;
      line-height: 1.8;
    }

    .signatory-block {
      text-align: center;
    }

    .signatory-line {
      width: 140px;
      border-top: 1px solid #cbd5e1;
      margin-bottom: 6px;
    }

    .signatory-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }

    /* ── Print ── */
    @media print {
      body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice-page { box-shadow: none; margin: 0; border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-page">

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="brand-logo"><img src="/mascot.png" alt="Shining Sparrow" /></div>
        <div class="brand-info">
          <div class="brand-name">Shining Sparrow</div>
          <div class="brand-address">Online Learning Platform</div>
          <div class="brand-contact">
            <strong>Ph:</strong> +91 98765 43210 &nbsp;|&nbsp;
            <strong>Email:</strong> support@shiningsparrow.com
          </div>
          <div class="brand-contact" style="margin-top:2px;">
            <strong>Website:</strong> www.shiningsparrow.com
          </div>
        </div>
      </div>
      <div class="invoice-badge">INVOICE</div>
    </div>

    <!-- Bill To -->
    <div class="bill-section">
      <div class="bill-left">
        <div class="bill-label">Bill To</div>
        <div class="bill-name">${studentName}</div>
        <div class="bill-detail">
          ${studentEmail}<br />
          ${studentPhone}
        </div>
      </div>
      <div class="bill-right">
        <div class="meta-row">
          <span class="meta-label">Invoice No.</span>
          <span class="meta-value">${invoiceNumber}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date</span>
          <span class="meta-value">${invoiceDate}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Type</span>
          <span class="meta-value">${typeLabel}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="items-section">
      <table class="items-table">
        <colgroup>
          <col class="col-sno" />
          <col class="col-desc" />
          <col class="col-qty" />
          <col class="col-rate" />
          <col class="col-amount" />
          ${hasDiscount ? '<col class="col-disc" />' : ''}
          <col class="col-total" />
        </colgroup>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Product Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
            ${hasDiscount ? '<th>Disc.</th>' : ''}
            <th>${hasDiscount ? 'Taxable Amt' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              ${productName}
              <div class="type-tag">${type}</div>
            </td>
            <td>1</td>
            <td>${formatCurrency(originalPrice)}</td>
            <td>${formatCurrency(originalPrice)}</td>
            ${hasDiscount ? `<td class="discount-cell">${formatCurrency(discountAmount)}</td>` : ''}
            <td style="font-weight:700; color:#0f172a;">${formatCurrency(finalAmount)}</td>
          </tr>
          <tr class="total-row">
            <td></td>
            <td>Total</td>
            <td>1</td>
            <td></td>
            <td>${formatCurrency(originalPrice)}</td>
            ${hasDiscount ? `<td>${formatCurrency(discountAmount)}</td>` : ''}
            <td>${formatCurrency(finalAmount)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      <table class="summary-table">
        <tr>
          <td>Total Before Tax</td>
          <td>${formatCurrency(originalPrice)}</td>
        </tr>
        ${hasDiscount ? `<tr class="discount-row"><td>Less: Discount</td><td>-${formatCurrency(discountAmount)}</td></tr>` : ''}
        <tr>
          <td>Round Off</td>
          <td>+₹0.00</td>
        </tr>
        <tr class="total-final">
          <td>Total Amount</td>
          <td>${formatCurrency(finalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- Amount in Words -->
    <div class="amount-words-section">
      <div class="amount-words-box">
        <span class="amount-words-label">Amount In Words: </span>
        <span class="amount-words-value">${words}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-section">
      <div>
        <div class="terms-title">Terms & Conditions</div>
        <ul class="terms-list">
          <li>1. Payment is due within 3 days of the invoice date.</li>
          <li>2. Late payments may incur additional charges.</li>
          <li>3. All disputes are subject to local jurisdiction.</li>
        </ul>
      </div>
      <div class="signatory-block">
        <div class="signatory-line"></div>
        <div class="signatory-label">Authorized Signatory</div>
      </div>
    </div>

  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 600);
    };
  </script>
</body>
</html>`;
}
