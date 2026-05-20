import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { InvoiceData } from '../../types/invoice';

export function InvoiceTemplate({ type, data, settings }: { type: string, data: InvoiceData, settings: any }) {
  const isPaid = data.balanceDue <= 0;
  const paddingClass = settings?.spacing === 'compact' ? 'p-6' : settings?.spacing === 'relaxed' ? 'p-12' : 'p-10';
  const tableCellPad = settings?.spacing === 'compact' ? 'py-2 px-3' : 'py-3 px-4';
  
  // QR Payload String
  const qrPayload = `Type: ${type}\nRef: ${data.billNo}\nAmt: Rs.${data.grandTotal}\nTo: ${data.partyName}`;

  return (
    <div className={`bg-white text-slate-800 w-[210mm] min-h-[297mm] mx-auto relative flex flex-col ${paddingClass}`} style={{ fontFamily: settings?.font_family || 'sans-serif' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: settings?.primary_color || '#2563EB' }}>
        <div className="flex gap-4 items-center max-w-[50%]">
          {data.companyDetails?.logo_base64 && (
            <img src={data.companyDetails.logo_base64} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-slate-100 p-1" />
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase" style={{ color: settings?.primary_color || '#2563EB' }}>
              {type === 'Sale' ? 'TAX INVOICE' : 'PURCHASE RECORD'}
            </h1>
            {data.companyDetails?.gst_number && <p className="text-slate-500 text-sm mt-1 font-bold">GSTIN: {data.companyDetails.gst_number}</p>}
          </div>
        </div>
        <div className="text-right max-w-[40%]">
          <h2 className="text-xl font-bold text-slate-900">{data.companyDetails?.business_name || 'Your Company Name'}</h2>
          <p className="text-sm text-slate-600 mt-1 leading-snug">{data.companyDetails?.address || 'Company Address Not Set'}</p>
          <p className="text-sm text-slate-600 mt-1">Ph: {data.companyDetails?.phone || 'N/A'} | {data.companyDetails?.email || ''}</p>
        </div>
      </div>

      {/* META */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2 pr-4 border-r border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
          <p className="text-lg font-bold text-slate-800 capitalize">{data.partyName || 'Cash Customer'}</p>
          {data.phone && <p className="text-sm text-slate-600">Phone: {data.phone}</p>}
        </div>
        <div className="w-1/2 pl-8 grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice No.</h3>
            <p className="text-sm font-bold text-slate-800">{data.billNo}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3>
            <p className="text-sm font-bold text-slate-800">{data.date}</p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="mb-6 flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white text-xs uppercase tracking-wider" style={{ backgroundColor: settings?.primary_color || '#1e293b' }}>
              <th className={`${tableCellPad} w-10 text-center`}>#</th>
              <th className={`${tableCellPad}`}>Item Description</th>
              <th className={`${tableCellPad} text-center`}>Qty</th>
              <th className={`${tableCellPad} text-right`}>Rate</th>
              {settings?.show_discount_column === 1 && <th className={`${tableCellPad} text-right`}>Disc.</th>}
              {settings?.show_tax_column === 1 && <th className={`${tableCellPad} text-center`}>Tax</th>}
              <th className={`${tableCellPad} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody className="border-b border-slate-200">
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 text-sm">
                <td className={`${tableCellPad} text-center text-slate-500`}>{index + 1}</td>
                <td className={`${tableCellPad} font-semibold text-slate-800`}>{item.name}</td>
                <td className={`${tableCellPad} text-center`}>{item.qty}</td>
                <td className={`${tableCellPad} text-right`}> {Number(item.price || 0).toFixed(2)}</td>
                {settings?.show_discount_column === 1 && <td className={`${tableCellPad} text-right text-slate-500`}>{item.discount > 0 ? ` ${item.discount}` : '-'}</td>}
                {settings?.show_tax_column === 1 && <td className={`${tableCellPad} text-center text-slate-500`}>{item.taxRate > 0 ? `${item.taxRate}%` : 'NIL'}</td>}
                <td className={`${tableCellPad} text-right font-bold text-slate-800`}> {Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER & TOTALS */}
      <div className="flex justify-between items-end mt-auto pt-6 border-t-2 border-slate-200">
        <div className="w-1/2 pr-8 flex flex-col gap-4">
           
           {/* RESTORED: Notes Section */}
           {settings?.show_notes === 1 && data.notes && (
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</h3>
               <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">{data.notes}</p>
             </div>
           )}

           {/* RESTORED: Terms & Conditions */}
           {settings?.custom_terms && (
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Terms & Conditions</h3>
               <p className="text-[10px] text-slate-500 whitespace-pre-wrap">{settings.custom_terms}</p>
             </div>
           )}

           {/* QR Code Segment */}
           <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 w-fit mt-2">
              <QRCodeSVG value={qrPayload} size={64} />
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scan to Verify</p>
                 <p className="text-xs font-medium text-slate-600">Scan this QR code<br/>for invoice details.</p>
              </div>
           </div>
           
          {settings?.show_bank_details === 1 && settings?.bank_details_text && (
            <div className="mt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Details</h3>
              <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium">{settings.bank_details_text}</p>
            </div>
          )}
        </div>
        
        <div className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between text-sm mb-2 text-slate-600"><span>Sub Total</span><span className="font-semibold"> {data.subTotal.toFixed(2)}</span></div>
          {data.globalDiscount > 0 && <div className="flex justify-between text-sm mb-2 text-rose-600"><span>Discount</span><span className="font-semibold">-  {data.globalDiscount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-sm mb-2 text-slate-600"><span>Total Tax</span><span className="font-semibold"> {data.totalTax.toFixed(2)}</span></div>
          {data.roundOff !== 0 && <div className="flex justify-between text-sm mb-3 text-slate-600"><span>Round Off</span><span className="font-semibold">{data.roundOff > 0 ? '+' : ''} {data.roundOff.toFixed(2)}</span></div>}
          
          <div className="flex justify-between items-center border-t border-slate-300 pt-3 mb-3">
            <span className="text-base font-bold text-slate-800">Grand Total</span>
            <span className="text-2xl font-black" style={{ color: settings?.primary_color || '#1d4ed8' }}> {data.grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-3 mt-1">
            <span className="text-slate-800">Balance Due</span>
            <span className={data.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>{data.balanceDue > 0 ? ` ${data.balanceDue.toFixed(2)}` : 'PAID'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}