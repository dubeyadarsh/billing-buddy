import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { InvoiceData } from '../../types/invoice';

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
      <div className="flex justify-between items-start pb-4 border-b-2 avoid-break" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-4">
          {data.companyDetails?.logo_base64 && (
            <img src={data.companyDetails.logo_base64} alt="Logo" className="w-16 h-16 object-contain rounded-xl shadow-sm border border-slate-100 p-1.5" />
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1.5">
              {data.companyDetails?.business_name || 'Your Company'}
            </h1>
            <p className="text-[11px] text-slate-500 max-w-[250px] leading-snug">
              {data.companyDetails?.address || 'Company Address Not Set'}
            </p>
            {data.companyDetails?.gst_number && (
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                GSTIN: <span className="text-slate-600">{data.companyDetails.gst_number}</span>
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end justify-start">
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-none" style={{ color: primaryColor }}>
             {data.isQuotation ? 'QUOTATION' : (data.type === 'Purchase' ? 'PURCHASE' : 'INVOICE')}
          </h2>
          {data.isQuotation && (
             <span className="mt-2 px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold tracking-widest uppercase rounded">Not a Tax Invoice</span>
          )}
        </div>
      </div>

      {/* 2. THE META STRIP: Space-saving horizontal dashboard */}
      <div className="grid grid-cols-3 gap-6 bg-slate-50/80 border border-slate-100 p-4 rounded-xl mt-5 mb-5 avoid-break">
        {/* Block A: Billed To */}
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billed To</p>
          <p className="text-sm font-bold text-slate-800 leading-tight truncate">{data.partyName || 'Cash Customer'}</p>
          {data.phone && <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Ph: {data.phone}</p>}
        </div>
        
        {/* Block B: Invoice Details */}
        <div className="min-w-0 border-l border-slate-200 pl-6">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Record Details</p>
          <p className="text-[11px] text-slate-600 mb-0.5">Ref No: <span className="font-bold text-slate-800">{data.billNo}</span></p>
          <p className="text-[11px] text-slate-600">Date: <span className="font-bold text-slate-800">{data.date}</span></p>
        </div>

        {/* Block C: Amount Due Highlight */}
        <div className="min-w-0 border-l border-slate-200 pl-6 flex flex-col justify-center">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount Due</p>
           <p className="text-xl font-black leading-none" style={{ color: data.balanceDue > 0 ? primaryColor : '#10b981' }}>
             {data.balanceDue > 0 ? `₹${data.balanceDue.toFixed(2)}` : 'PAID'}
           </p>
        </div>
      </div>

      {/* 3. ITEMS TABLE: Minimalist and highly dense */}
      <div className="mb-4 flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b-2 w-8" style={{ borderColor: primaryColor }}>#</th>
              <th className="py-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b-2" style={{ borderColor: primaryColor }}>Description</th>
              <th className="py-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b-2 text-center w-12" style={{ borderColor: primaryColor }}>Qty</th>
              <th className="py-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b-2 text-right w-20" style={{ borderColor: primaryColor }}>Rate</th>
              <th className="py-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b-2 text-right w-24" style={{ borderColor: primaryColor }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-50 avoid-break group hover:bg-slate-50/50 transition-colors">
                <td className="py-2 px-2 text-[11px] font-medium text-slate-400 align-top">{index + 1}</td>
                <td className="py-2 px-2 text-[11px] font-bold text-slate-700 align-top">
                  {item.name}
                  {(item.serialNo || item.serial_no) && (
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                      S/N: {item.serialNo || item.serial_no}
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-[11px] font-medium text-center text-slate-600 align-top">{item.qty}</td>
                <td className="py-2 px-2 text-[11px] font-medium text-right text-slate-600 align-top">{Number(item.price || 0).toFixed(2)}</td>
                <td className="py-2 px-2 text-[11px] font-black text-right text-slate-800 align-top">{Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. FOOTER: Clean alignment */}
      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end gap-8 avoid-break w-full">
        
        {/* Notes & QR */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex gap-6">
            {settings?.show_notes === 1 && data.notes && (
              <div className="flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{data.notes}</p>
              </div>
            )}
            {settings?.show_bank_details === 1 && settings?.bank_details_text && (
              <div className="flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Details</p>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{settings.bank_details_text}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center opacity-80">
             <div className="p-1 border border-slate-200 rounded-md bg-white shadow-sm">
               <QRCodeSVG value={qrPayload} size={32} />
             </div>
             <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold leading-tight">Authentic<br/>Document</p>
          </div>
        </div>

        {/* Totals Calculation */}
        <div className="w-[220px] shrink-0">
            <div className="flex justify-between py-1 text-slate-500 text-[11px] font-medium">
               <span>Subtotal</span><span>₹{data.subTotal.toFixed(2)}</span>
            </div>
            {data.globalDiscount > 0 && (
               <div className="flex justify-between py-1 text-rose-500 text-[11px] font-medium">
                  <span>Discount</span><span>-₹{data.globalDiscount.toFixed(2)}</span>
               </div>
            )}
            <div className="flex justify-between py-1 text-slate-500 text-[11px] font-medium border-b border-slate-100 pb-2 mb-2">
               <span>Total Tax</span><span>₹{data.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
               <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Grand Total</span>
               <span className="text-lg font-black" style={{ color: primaryColor }}>₹{data.grandTotal.toFixed(2)}</span>
            </div>
        </div>
      </div>
    </div>
  );
}