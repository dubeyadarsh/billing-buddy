import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { InvoiceData } from '../../types/invoice';

export const TemplateModern: React.FC<{ data: InvoiceData, settings?: any }> = ({ data, settings }) => {
  const qrPayload = `Type: ${data.type || 'Sale'}\nRef: ${data.billNo}\nAmt: Rs.${data.grandTotal}\nTo: ${data.partyName}`;
  const primaryColor = settings?.primary_color || '#2563EB';

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] print:min-h-[275mm] print:m-0 print:p-0 box-border bg-white p-12 text-slate-900 mx-auto shadow-sm border border-slate-200 flex flex-col" style={{ fontFamily: settings?.font_family || 'sans-serif' }}>
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

      {/* Header */}
      <div className="flex justify-between border-b-2 pb-6 mb-8 avoid-break" style={{ borderColor: primaryColor }}>
        <div>
          <h1 className="text-4xl font-black tracking-tighter" style={{ color: primaryColor }}>
            {data.type === 'Purchase' ? 'PURCHASE RECORD' : 'TAX INVOICE'}
          </h1>
          <div className="flex gap-4 items-center mt-4">
             {data.companyDetails?.logo_base64 && (
                <img src={data.companyDetails.logo_base64} alt="Logo" className="w-16 h-16 object-contain rounded border border-slate-100 p-1" />
             )}
             <div>
                <p className="font-bold text-xl text-slate-800">{data.companyDetails?.business_name || 'Your Company'}</p>
                <p className="text-sm text-slate-500 mt-1">{data.companyDetails?.address || 'Company Address'}</p>
                {data.companyDetails?.gst_number && <p className="text-sm font-semibold text-slate-600 mt-1">GSTIN: {data.companyDetails.gst_number}</p>}
             </div>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block min-w-[160px]">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice No</p>
             <p className="text-lg font-black text-slate-800 mb-2">{data.billNo}</p>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
             <p className="text-sm font-bold text-slate-800">{data.date}</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8 avoid-break">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
        <p className="text-2xl font-bold text-slate-800">{data.partyName || 'Cash Customer'}</p>
        {data.phone && <p className="text-sm text-slate-600 mt-1">Phone: {data.phone}</p>}
      </div>

      {/* Items */}
      <div className="mb-8 flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: primaryColor }}>
              <th className="py-3 px-2 text-sm font-bold text-slate-400 w-12">#</th>
              <th className="py-3 px-2 text-sm font-bold text-slate-800">Description</th>
              <th className="py-3 px-2 text-sm font-bold text-slate-800 text-center w-20">Qty</th>
              <th className="py-3 px-2 text-sm font-bold text-slate-800 text-right w-24">Rate</th>
              <th className="py-3 px-2 text-sm font-bold text-slate-800 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 avoid-break">
                <td className="py-4 px-2 text-slate-400 align-top">{index + 1}</td>
                <td className="py-4 px-2 font-semibold text-slate-800 align-top">
                  {item.name}
                  {(item.serialNo || item.serial_no) && (
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5 tracking-wide">
                      S/N: {item.serialNo || item.serial_no}
                    </div>
                  )}
                </td>
                <td className="py-4 px-2 text-center text-slate-600 align-top">{item.qty}</td>
                <td className="py-4 px-2 text-right text-slate-600 align-top">{Number(item.price || 0).toFixed(2)}</td>
                <td className="py-4 px-2 text-right font-bold text-slate-800 align-top">{Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Area */}
      <div className="grid grid-cols-2 gap-8 mt-auto pt-4 avoid-break w-full">
        <div>
          {settings?.show_notes === 1 && data.notes && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{data.notes}</p>
            </div>
          )}
          {settings?.show_bank_details === 1 && settings?.bank_details_text && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Details</p>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{settings.bank_details_text}</p>
            </div>
          )}
          <div className="flex gap-4 items-center">
             <QRCodeSVG value={qrPayload} size={48} />
             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Scan to Verify</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex justify-between py-1.5 text-slate-600 text-sm"><span>Subtotal:</span><span className="font-semibold">₹{data.subTotal.toFixed(2)}</span></div>
            {data.globalDiscount > 0 && <div className="flex justify-between py-1.5 text-rose-600 text-sm"><span>Discount:</span><span className="font-semibold">-₹{data.globalDiscount.toFixed(2)}</span></div>}
            <div className="flex justify-between py-1.5 text-slate-600 text-sm border-b border-slate-200 pb-3 mb-2"><span>Total Tax:</span><span className="font-semibold">₹{data.totalTax.toFixed(2)}</span></div>
            <div className="flex justify-between py-2 text-xl font-black" style={{ color: primaryColor }}><span>Grand Total:</span><span>₹{data.grandTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-3 mt-2">
               <span className="text-slate-800">Balance Due:</span>
               <span className={data.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>{data.balanceDue > 0 ? `₹${data.balanceDue.toFixed(2)}` : 'PAID'}</span>
            </div>
        </div>
      </div>
    </div>
  );
}