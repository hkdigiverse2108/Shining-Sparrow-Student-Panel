import React from 'react';
import { usePaymentHistory } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/Loader';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import { CreditCard, Calendar, Receipt, TrendingUp, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react';
import { FALLBACK_COURSE_IMAGE, FALLBACK_WORKSHOP_IMAGE, handleImageError } from '../utils/fallbacks';

interface PaymentRecord {
  _id: string;
  type: 'course' | 'workshop';
  name: string;
  image: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  date: string;
}

export const PaymentHistoryPage = () => {
  const { data: historyRes, isLoading, error } = usePaymentHistory();
  const { student } = useAuth();

  const handleDownloadInvoice = (record: PaymentRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the invoice.');
      return;
    }

    const invoiceDate = new Date(record.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const studentName = student?.fullName || 'N/A';
    const studentEmail = student?.email || 'N/A';
    const studentPhone = student?.phoneNumber || 'N/A';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${record.orderId}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            margin: 0;
            padding: 40px;
            background-color: #fff;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .logo-area {
            font-size: 28px;
            font-weight: 800;
            color: #f97316;
            letter-spacing: -0.5px;
          }
          .logo-sub {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          .invoice-title {
            text-align: right;
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .info-col {
            width: 50%;
            vertical-align: top;
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 10px;
          }
          .details-text {
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
          }
          .details-text strong {
            color: #0f172a;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            margin-bottom: 40px;
          }
          .item-table th {
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            color: #475569;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 16px;
            text-align: left;
          }
          .item-table td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            color: #334155;
          }
          .item-table .text-right {
            text-align: right;
          }
          .summary-table {
            width: 350px;
            margin-left: auto;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 8px 16px;
            font-size: 14px;
            color: #475569;
          }
          .summary-table tr.total-row td {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            border-top: 2px solid #e2e8f0;
            padding-top: 12px;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
          }
          @media print {
            body {
              padding: 0;
            }
            .invoice-container {
              border: none;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <table class="header-table">
            <tr>
              <td>
                <div class="logo-area">Shining Sparrow</div>
                <div class="logo-sub">Online Learning Platform</div>
              </td>
              <td class="invoice-title">Invoice</td>
            </tr>
          </table>

          <table class="info-table">
            <tr>
              <td class="info-col">
                <div class="section-title">Billed To</div>
                <div class="details-text">
                  <strong>${studentName}</strong><br>
                  Email: ${studentEmail}<br>
                  Phone: ${studentPhone}
                </div>
              </td>
              <td class="info-col" style="text-align: right;">
                <div class="section-title">Invoice Details</div>
                <div class="details-text">
                  <strong>Invoice No:</strong> INV-${record.orderId.replace('order_', '')}<br>
                  <strong>Date:</strong> ${invoiceDate}<br>
                  <strong>Payment ID:</strong> ${record.paymentId}<br>
                  <strong>Status:</strong> ${record.status.toUpperCase()}
                </div>
              </td>
            </tr>
          </table>

          <table class="item-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600; color: #0f172a;">${record.name}</td>
                <td><span style="text-transform: capitalize;">${record.type}</span> Enrollment</td>
                <td class="text-right">₹${record.amount.toLocaleString('en-IN')}</td>
                <td class="text-right" style="font-weight: 600;">₹${record.amount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">₹${record.amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Tax (GST 0%):</td>
              <td class="text-right">₹0.00</td>
            </tr>
            <tr class="total-row">
              <td>Total Paid:</td>
              <td class="text-right">₹${record.amount.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <div class="footer">
            Thank you for learning with Shining Sparrow!<br>
            For any queries, contact support@shiningsparrow.com or visit www.shiningsparrow.com
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <AlertTriangle className="text-rose-500" /> Error Loading History
        </h2>
        <p className="text-slate-500 mt-2">Could not retrieve payment history. Please try again later.</p>
      </div>
    );
  }

  const paymentData = historyRes?.data || { history: [], totalSpent: 0 };
  const history: PaymentRecord[] = paymentData.history;
  const totalSpent: number = paymentData.totalSpent;

  return (
    <motion.div
      variants={pageChildVariants}
      initial="initial"
      animate="animate"
      className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Header */}
      <div className="border-b border-orange-100/60 dark:border-slate-800/40 pb-5">
        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary dark:text-brand-secondary bg-brand-primary/10 dark:bg-brand-primary/20 px-2.5 py-1 rounded-md">
          Billing Space
        </span>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white leading-tight mt-2.5">
          Payment History
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Keep track of all your course and workshop transactions.
        </p>
      </div>

      {/* Hero statistics card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-brand-primary to-orange-600 text-white rounded-3xl p-6 shadow-lg border border-orange-400/20 relative overflow-hidden flex items-center justify-between">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-white/5 rounded-full blur-xl" />
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded">
              Learning Investment
            </span>
            <h3 className="font-display font-black text-3xl leading-none pt-1">
              ₹{totalSpent.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-orange-100/90 font-medium">
              Total payment made to our website
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl relative z-10">
            <TrendingUp size={28} className="text-white" />
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Total Transactions
            </span>
            <h3 className="font-display font-black text-2xl text-slate-800 dark:text-white">
              {history.length}
            </h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">
              Courses & workshops purchased
            </p>
          </div>
          <div className="p-4 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-2xl text-brand-primary">
            <Receipt size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Successful Payments
            </span>
            <h3 className="font-display font-black text-2xl text-slate-800 dark:text-white">
              {history.filter((h) => h.status === 'completed').length}
            </h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">
              Verified active enrollments
            </p>
          </div>
          <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-500">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/40 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4.5 border-b border-orange-50/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
          <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-200">
            Transactions Statement
          </h3>
          <span className="text-[10px] font-bold text-slate-400">
            Sorted by date (Latest first)
          </span>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-orange-50/50 dark:divide-slate-800/40">
            {history.map((record) => {
              const fallbackImg = record.type === 'workshop' ? FALLBACK_WORKSHOP_IMAGE : FALLBACK_COURSE_IMAGE;
              const isCompleted = record.status === 'completed';
              
              return (
                <div 
                  key={record._id} 
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <img 
                      src={record.image || fallbackImg} 
                      alt={record.name}
                      onError={(e) => handleImageError(e, fallbackImg)}
                      className="w-12 h-12 rounded-xl object-cover border dark:border-slate-800 shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-xs text-slate-850 dark:text-slate-200 line-clamp-1 leading-snug">
                          {record.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide ${
                          record.type === 'workshop' 
                            ? 'bg-brand-secondary/15 text-brand-secondary' 
                            : 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-secondary'
                        }`}>
                          {record.type}
                        </span>
                      </div>
                      
                      {/* IDs */}
                      <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Receipt size={10} /> Order: <span className="font-mono text-slate-700 dark:text-slate-350">{record.orderId}</span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <CreditCard size={10} /> Payment: <span className="font-mono text-slate-700 dark:text-slate-350">{record.paymentId}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                    {/* Price */}
                    <span className="font-display font-black text-base text-slate-900 dark:text-white">
                      ₹{record.amount.toLocaleString('en-IN')}
                    </span>
                    
                    {/* Status & Date */}
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        isCompleted 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {isCompleted ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {record.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(record.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(record)}
                          className="flex items-center gap-1 text-[10px] font-bold text-orange-650 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-md transition-colors border border-orange-100 dark:border-orange-500/20"
                        >
                          <Download size={11} />
                          Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3.5">
            <span className="text-4xl block">💳</span>
            <p className="text-sm font-bold text-slate-650 dark:text-slate-300">No payment records found</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Any programs you unlock using the catalog will show up in this transaction statement.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
