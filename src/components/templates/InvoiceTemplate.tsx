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

export function InvoiceTemplate({ type, data, settings }: { type: string, data: InvoiceData | any, settings: any }) {
  const isPaid = data.balanceDue <= 0;
  
  const paddingClass = settings?.spacing === 'compact' ? 'p-4' : settings?.spacing === 'relaxed' ? 'p-8' : 'p-6';
  const tableCellPad = settings?.spacing === 'compact' ? 'py-1 px-2' : 'py-1.5 px-3';
  
  const displayInvoiceNo = data.billNo || data.invoice_no || data.invoiceNo || 'N/A';
  const qrPayload = `Type: ${type}\nRef: ${displayInvoiceNo}\nAmt: Rs.${data.grandTotal}\nTo: ${data.partyName}`;

  return (
    <div 
      className={`bg-white text-slate-800 w-full max-w-[210mm] min-h-[297mm] print:min-h-[275mm] mx-auto relative flex flex-col shadow-sm border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:flex box-border ${paddingClass}`} 
      style={{ fontFamily: settings?.font_family || 'sans-serif' }}
    >
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 10mm 8mm; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              background: white; 
            }
            .avoid-break { 
              page-break-inside: avoid; 
              break-inside: avoid; 
            }
            thead { display: table-header-group; }
          }
        `}
      </style>

      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 pb-4 mb-4 gap-4 avoid-break" style={{ borderColor: settings?.primary_color || '#2563EB' }}>
        <div className="flex gap-4 items-center flex-1 min-w-0">
          {data.companyDetails?.logo_base64 && (
            <img src={data.companyDetails.logo_base64} alt="Logo" className="w-20 h-20 object-contain rounded-lg shrink-0 bg-white" />
          )}
          <div className="min-w-0 w-full">
            <h1 className="text-3xl font-black tracking-tight uppercase break-words leading-tight" style={{ color: settings?.primary_color || '#1e293b' }}>
              {data.companyDetails?.business_name || 'Your Company Name'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed break-words pr-4">
              {data.companyDetails?.address || 'Company Address Not Set'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-600">
              {data.companyDetails?.phone && <span><strong className="text-slate-500 font-medium">Ph:</strong> {data.companyDetails.phone}</span>}
              {data.companyDetails?.email && <span><strong className="text-slate-500 font-medium">Email:</strong> {data.companyDetails.email}</span>}
            </div>
            {data.companyDetails?.gst_number && (
              <div className="inline-block mt-1.5 px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 uppercase tracking-wider">
                GSTIN: {data.companyDetails.gst_number}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right shrink-0 flex flex-col items-end">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-2" style={{ color: settings?.primary_color || '#94a3b8' }}>
            {data.isQuotation ? 'QUOTATION' : (type === 'Sale' ? 'TAX INVOICE' : 'PURCHASE')}
          </h2>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg min-w-[140px] text-left shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ref No.</p>
            <p className="text-sm font-bold text-slate-800 mb-2">{displayInvoiceNo}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
            <p className="text-sm font-bold text-slate-800">{data.date}</p>
          </div>
        </div>
      </div>

      {data.isQuotation && (
        <div className="mb-4 avoid-break bg-rose-50 border border-rose-200 p-2 rounded-md text-center">
          <p className="text-rose-600 font-black tracking-widest uppercase text-sm">
            ** THIS IS A QUOTATION. THIS IS NOT A VALID TAX INVOICE **
          </p>
        </div>
      )}

      {/* BILLED TO */}
      <div className="flex justify-between mb-5 bg-slate-50 border border-slate-200 rounded-xl p-4 avoid-break">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
            Billed To
            <span className="h-px bg-slate-200 flex-1"></span>
          </h3>
          <p className="text-lg font-bold text-slate-800 capitalize break-words">{data.partyName || 'Cash Customer'}</p>
          {data.phone && <p className="text-sm text-slate-600 mt-1 font-medium">Phone: {data.phone}</p>}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-6 flex-1 w-full">
        <table className="w-full text-left border-collapse border border-slate-300 shadow-sm">
          <thead>
            <tr className="text-white text-xs uppercase tracking-wider" style={{ backgroundColor: settings?.primary_color || '#1e293b' }}>
              <th className={`border border-slate-400 ${tableCellPad} w-10 text-center font-bold`}>#</th>
              <th className={`border border-slate-400 ${tableCellPad} font-bold`}>Item Description</th>
              <th className={`border border-slate-400 ${tableCellPad} w-32 font-bold`}>Serial No.</th>
              <th className={`border border-slate-400 ${tableCellPad} w-24 font-bold`}>Warranty</th>
              <th className={`border border-slate-400 ${tableCellPad} w-16 text-center font-bold whitespace-nowrap`}>Qty</th>
              <th className={`border border-slate-400 ${tableCellPad} w-24 text-right font-bold whitespace-nowrap`}>Rate</th>
              {settings?.show_discount_column === 1 && <th className={`border border-slate-400 ${tableCellPad} w-20 text-right font-bold whitespace-nowrap`}>Disc.</th>}
              {settings?.show_tax_column === 1 && <th className={`border border-slate-400 ${tableCellPad} w-16 text-center font-bold whitespace-nowrap`}>Tax</th>}
              <th className={`border border-slate-400 ${tableCellPad} w-28 text-right font-bold whitespace-nowrap`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any, index: number) => {
              const itemSerial = item.serialNo || item.serial_no || '';
              const itemWarranty = item.warranty || '';
              
              return (
                <tr key={index} className="text-xs avoid-break hover:bg-slate-50 transition-colors">
                  <td className={`border border-slate-300 ${tableCellPad} text-center text-slate-700 align-top font-medium`}>{index + 1}</td>
                  
                  <td className={`border border-slate-300 ${tableCellPad} font-semibold text-slate-800 break-words align-top`}>
                    {item.name || item.item_name}
                  </td>
                  
                  <td className={`border border-slate-300 ${tableCellPad} text-slate-600 break-words align-top font-mono text-[11px]`}>
                    {itemSerial ? itemSerial : <span className="text-slate-300">-</span>}
                  </td>

                  <td className={`border border-slate-300 ${tableCellPad} text-slate-600 break-words align-top`}>
                    {itemWarranty ? itemWarranty : <span className="text-slate-300">-</span>}
                  </td>
                  
                  <td className={`border border-slate-300 ${tableCellPad} text-center text-slate-800 font-medium align-top`}>{item.qty}</td>
                  <td className={`border border-slate-300 ${tableCellPad} text-right text-slate-700 whitespace-nowrap align-top`}>{Number(item.price || 0).toFixed(2)}</td>
                  {settings?.show_discount_column === 1 && <td className={`border border-slate-300 ${tableCellPad} text-right text-slate-500 whitespace-nowrap align-top`}>{item.discount > 0 ? `${item.discount}` : '-'}</td>}
                  {settings?.show_tax_column === 1 && <td className={`border border-slate-300 ${tableCellPad} text-center text-slate-500 whitespace-nowrap align-top`}>{item.taxRate > 0 ? `${item.taxRate}%` : 'NIL'}</td>}
                  <td className={`border border-slate-300 ${tableCellPad} text-right font-black text-slate-800 whitespace-nowrap align-top`}>{Number(item.amount || 0).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-start pt-4 border-t border-slate-200 gap-6 mt-auto avoid-break w-full">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          
          {/* Amount in Words */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg avoid-break">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount (in words)</h3>
            <p className="text-sm font-bold text-slate-800 italic">{amountToWords(data.grandTotal)}</p>
          </div>

          {settings?.show_notes === 1 && data.notes && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium break-words leading-relaxed">{data.notes}</p>
            </div>
          )}

          {settings?.custom_terms && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Terms & Conditions</h3>
              <p className="text-xs text-slate-500 whitespace-pre-wrap break-words leading-relaxed">{settings.custom_terms}</p>
            </div>
          )}

          {settings?.show_bank_details === 1 && settings?.bank_details_text && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg avoid-break">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Details</h3>
              <p className="text-sm text-slate-800 whitespace-pre-wrap font-semibold break-words">{settings.bank_details_text}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3 w-fit mt-auto avoid-break pt-2">
              <div className="p-1.5 bg-white border border-slate-200 rounded shadow-sm">
                <QRCodeSVG value={qrPayload} size={48} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Scan to Verify</p>
                <p className="text-xs font-semibold text-slate-600 leading-tight">Authentic<br/>Digital Record</p>
              </div>
          </div>
        </div>
        
        <div className="w-[280px] shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-5 avoid-break shadow-sm">
          <div className="flex justify-between text-sm mb-2.5 text-slate-600">
            <span>Sub Total</span><span className="font-semibold whitespace-nowrap">{data.subTotal.toFixed(2)}</span>
          </div>
          
          {data.globalDiscount > 0 && (
            <div className="flex justify-between text-sm mb-2.5 text-rose-500">
                <span>Discount</span><span className="font-semibold whitespace-nowrap">- {data.globalDiscount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm mb-2.5 text-slate-600">
            <span>Total Tax</span><span className="font-semibold whitespace-nowrap">{data.totalTax.toFixed(2)}</span>
          </div>
          
          {data.roundOff !== 0 && (
            <div className="flex justify-between text-sm mb-4 text-slate-500">
                <span>Round Off</span><span className="font-semibold whitespace-nowrap">{data.roundOff > 0 ? '+' : ''} {data.roundOff.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center border-t-2 border-slate-200 pt-3 mb-2">
            <span className="text-base font-bold text-slate-800">Grand Total</span>
            <span className="text-xl font-black whitespace-nowrap" style={{ color: settings?.primary_color || '#1e293b' }}>{data.grandTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm mb-3 text-emerald-600">
            <span>Paid Amount</span><span className="font-semibold whitespace-nowrap">{Number(data.paidAmount || 0).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-3">
            <span className="text-slate-600">Balance Due</span>
            <span className={`whitespace-nowrap px-3 py-1 rounded-full text-xs tracking-wide font-bold shadow-sm ${data.balanceDue > 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
              {data.balanceDue > 0 ? `${data.balanceDue.toFixed(2)}` : 'PAID'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}