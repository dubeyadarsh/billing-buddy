import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { InvoiceData } from '../../types/invoice';

// Helper function to convert numbers to Indian Rupees in words
const amountToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';
  if (n.toString().length > 9) return 'Amount too large';
  const match = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return '';
  let str = '';
  str += (match[1] !== '00') ? (a[Number(match[1])] || b[Number(match[1][0])] + ' ' + a[Number(match[1][1])]) + 'Crore ' : '';
  str += (match[2] !== '00') ? (a[Number(match[2])] || b[Number(match[2][0])] + ' ' + a[Number(match[2][1])]) + 'Lakh ' : '';
  str += (match[3] !== '00') ? (a[Number(match[3])] || b[Number(match[3][0])] + ' ' + a[Number(match[3][1])]) + 'Thousand ' : '';
  str += (match[4] !== '00') ? (a[Number(match[4])] || b[Number(match[4][0])] + ' ' + a[Number(match[4][1])]) + 'Hundred ' : '';
  str += (match[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(match[5])] || b[Number(match[5][0])] + ' ' + a[Number(match[5][1])]) + 'Rupees ' : 'Rupees ';
  return str.trim() + ' Only';
};

export const TemplateModern: React.FC<{ data: InvoiceData, settings?: any }> = ({ data, settings }) => {
  const qrPayload = `Type: ${data.type || 'Sale'}\nRef: ${data.billNo}\nAmt: Rs.${data.grandTotal}\nTo: ${data.partyName}`;
  const primaryColor = settings?.primary_color || '#0f172a'; // Default to deep slate if no color

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] print:min-h-[275mm] print:m-0 print:p-0 box-border bg-white p-8 text-slate-900 mx-auto shadow-sm border border-slate-200 flex flex-col" style={{ fontFamily: settings?.font_family || 'sans-serif' }}>
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 10mm 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white; }
            .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            thead { display: table-header-group; }
          }
        `}
      </style>

      {/* 1. BRAND HEADER: Uncluttered, Prominent Company Info */}
      <div className="flex justify-between items-start pb-5 border-b-2 avoid-break" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-5">
          {data.companyDetails?.logo_base64 && (
            <img src={data.companyDetails.logo_base64} alt="Logo" className="w-20 h-20 object-contain rounded-xl shrink-0" />
          )}
          <div className="flex flex-col">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none mb-2">
              {data.companyDetails?.business_name || 'Your Company'}
            </h1>
            <p className="text-sm text-slate-500 max-w-[300px] leading-snug">
              {data.companyDetails?.address || 'Company Address Not Set'}
            </p>
            {data.companyDetails?.gst_number && (
              <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
                GSTIN: <span className="text-slate-600">{data.companyDetails.gst_number}</span>
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end justify-start">
          <h2 className="text-2xl font-black tracking-widest uppercase leading-none mt-2" style={{ color: primaryColor }}>
             {data.isQuotation ? 'QUOTATION' : (data.type === 'Purchase' ? 'PURCHASE' : 'INVOICE')}
          </h2>
          {data.isQuotation && (
             <span className="mt-2 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold tracking-widest uppercase rounded">Not a Tax Invoice</span>
          )}
        </div>
      </div>

      {/* 2. THE META STRIP: Space-saving horizontal dashboard */}
      <div className="grid grid-cols-3 gap-6 bg-slate-50/80 border border-slate-200 p-5 rounded-xl mt-6 mb-6 avoid-break shadow-sm">
        {/* Block A: Billed To */}
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Billed To</p>
          <p className="text-lg font-bold text-slate-800 leading-tight truncate">{data.partyName || 'Cash Customer'}</p>
          {data.phone && <p className="text-xs text-slate-500 mt-1 font-medium">Ph: {data.phone}</p>}
        </div>
        
        {/* Block B: Invoice Details */}
        <div className="min-w-0 border-l border-slate-200 pl-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Record Details</p>
          <p className="text-sm text-slate-600 mb-1">Ref No: <span className="font-bold text-slate-800">{data.billNo}</span></p>
          <p className="text-sm text-slate-600">Date: <span className="font-bold text-slate-800">{data.date}</span></p>
        </div>

        {/* Block C: Amount Due Highlight */}
        <div className="min-w-0 border-l border-slate-200 pl-6 flex flex-col justify-center">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount Due</p>
           <p className="text-2xl font-black leading-none" style={{ color: data.balanceDue > 0 ? primaryColor : '#10b981' }}>
             {data.balanceDue > 0 ? `₹${data.balanceDue.toFixed(2)}` : 'PAID'}
           </p>
        </div>
      </div>

      {/* 3. ITEMS TABLE: Structured Grid */}
      <div className="mb-6 flex-1">
        <table className="w-full text-left border-collapse border border-slate-300 shadow-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-2.5 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 w-10 text-center">#</th>
              <th className="py-2.5 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300">Description</th>
              <th className="py-2.5 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 text-center w-16">Qty</th>
              <th className="py-2.5 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 text-right w-24">Rate</th>
              <th className="py-2.5 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="avoid-break hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 text-sm font-medium text-slate-600 align-top text-center border border-slate-300">{index + 1}</td>
                <td className="py-2.5 px-3 text-sm font-bold text-slate-800 align-top border border-slate-300">
                  {item.name}
                  {(item.serialNo || item.serial_no) && (
                    <div className="text-xs text-slate-500 font-medium mt-1 font-mono">
                      S/N: {item.serialNo || item.serial_no}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-sm font-semibold text-center text-slate-700 align-top border border-slate-300">{item.qty}</td>
                <td className="py-2.5 px-3 text-sm font-medium text-right text-slate-700 align-top border border-slate-300">{Number(item.price || 0).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-sm font-black text-right text-slate-900 align-top border border-slate-300">{Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. FOOTER: Clean alignment */}
      <div className="mt-auto pt-5 border-t border-slate-200 flex justify-between items-end gap-8 avoid-break w-full">
        
        {/* Notes & QR */}
        <div className="flex-1 flex flex-col gap-5">
          
          <div className="bg-slate-50/80 border border-slate-200 p-3 rounded-lg avoid-break w-fit pr-8">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount (in words)</p>
             <p className="text-sm font-bold text-slate-800 italic">{amountToWords(data.grandTotal)}</p>
          </div>

          <div className="flex gap-6">
            {settings?.show_notes === 1 && data.notes && (
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notes</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{data.notes}</p>
              </div>
            )}
            {settings?.show_bank_details === 1 && settings?.bank_details_text && (
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bank Details</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{settings.bank_details_text}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 items-center opacity-90 mt-2">
             <div className="p-1.5 border border-slate-200 rounded-md bg-white shadow-sm">
               <QRCodeSVG value={qrPayload} size={40} />
             </div>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-tight">Authentic<br/>Document</p>
          </div>
        </div>

        {/* Totals Calculation */}
        <div className="w-[260px] shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between py-1 text-slate-600 text-sm font-medium">
               <span>Subtotal</span><span>₹{data.subTotal.toFixed(2)}</span>
            </div>
            {data.globalDiscount > 0 && (
               <div className="flex justify-between py-1 text-rose-500 text-sm font-medium">
                  <span>Discount</span><span>-₹{data.globalDiscount.toFixed(2)}</span>
               </div>
            )}
            <div className="flex justify-between py-1 text-slate-600 text-sm font-medium border-b border-slate-200 pb-3 mb-2">
               <span>Total Tax</span><span>₹{data.totalTax.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-1">
               <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Grand Total</span>
               <span className="text-xl font-black" style={{ color: primaryColor }}>₹{data.grandTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between py-1 mt-1 text-emerald-600 text-sm font-medium">
               <span>Paid Amount</span><span>₹{Number(data.paidAmount || 0).toFixed(2)}</span>
            </div>
            
            {data.balanceDue > 0 && (
              <div className="flex justify-between py-1 mt-1 text-rose-600 text-sm font-bold border-t border-slate-200 pt-2">
                 <span>Balance Due</span><span>₹{data.balanceDue.toFixed(2)}</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}