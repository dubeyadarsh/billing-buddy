import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { InvoiceData } from '../../types/invoice';

export const TemplateModern: React.FC<{ data: InvoiceData, settings?: any }> = ({ data, settings }) => {
  
  // Create a QR payload string
  const qrPayload = `Type: ${data.type || 'Sale'}\nRef: ${data.billNo}\nAmt: Rs.${data.grandTotal}\nTo: ${data.partyName}`;

  // Grab the primary color from settings, or fallback to blue
  const primaryColor = settings?.primary_color || '#2563EB';

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-12 text-slate-900 mx-auto shadow-sm border border-slate-200 flex flex-col" style={{ fontFamily: settings?.font_family || 'sans-serif' }}>
      
      {/* Header */}
      <div className="flex justify-between border-b-2 pb-6 mb-8" style={{ borderColor: primaryColor }}>
        <div>
          <h1 className="text-4xl font-black tracking-tighter" style={{ color: primaryColor }}>
            {data.type === 'Purchase' ? 'PURCHASE RECORD' : 'TAX INVOICE'}
          </h1>
          
          <div className="flex gap-4 items-center mt-4">
             {/* DYNAMIC LOGO */}
             {data.companyDetails?.logo_base64 && (
                <img src={data.companyDetails.logo_base64} alt="Logo" className="w-16 h-16 object-contain rounded border border-slate-100 p-1" />
             )}
             <div>
                <p className="text-slate-900 font-bold text-lg">{data.companyDetails?.business_name || 'My Company'}</p>
                <p className="text-slate-500 text-sm">GSTIN: {data.companyDetails?.gst_number || 'Unregistered'}</p>
                <p className="text-slate-500 text-xs mt-0.5 whitespace-pre-wrap">{data.companyDetails?.address}</p>
             </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-sm mb-1">Billed To:</p>
          <p className="font-bold text-lg">{data.partyName || 'Cash Customer'}</p>
          {data.phone && <p className="text-slate-500 text-sm">Ph: {data.phone}</p>}
          <div className="mt-4">
            <p className="text-slate-900 font-medium">Date: {data.date}</p>
            <p className="text-slate-900 font-medium">Ref No: {data.billNo}</p>
          </div>
        </div>
      </div>

      {/* Item Table */}
      <div className="flex-1">
        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b-2 border-slate-300 text-sm">
              <th className="py-3">Item Description</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Rate</th>
              {settings?.show_discount_column === 1 && <th className="py-3 text-right">Disc.</th>}
              {settings?.show_tax_column === 1 && <th className="py-3 text-right">Tax</th>}
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 font-medium text-slate-800">{item.name || 'Unnamed Item'}</td>
                <td className="py-3 text-center">{item.qty}</td>
                <td className="py-3 text-right">₹{Number(item.price).toFixed(2)}</td>
                {settings?.show_discount_column === 1 && <td className="py-3 text-right text-slate-500">{item.discount > 0 ? `₹${item.discount}` : '-'}</td>}
                {settings?.show_tax_column === 1 && <td className="py-3 text-right text-slate-500">{item.taxRate > 0 ? `${item.taxRate}%` : 'NIL'}</td>}
                <td className="py-3 text-right font-bold text-slate-900">₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Footer Info */}
      <div className="flex justify-between items-end mt-auto pt-6 border-t border-slate-200">
         
         {/* Left Side: QR, Bank, Notes & Terms */}
         <div className="w-1/2 pr-8 flex flex-col gap-4">
            
            {/* Notes Section */}
            {settings?.show_notes === 1 && data.notes && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</h3>
                <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">{data.notes}</p>
              </div>
            )}

            {/* Terms & Conditions */}
            {settings?.custom_terms && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Terms & Conditions</h3>
                <p className="text-[10px] text-slate-500 whitespace-pre-wrap">{settings.custom_terms}</p>
              </div>
            )}

            {/* QR Code Segment */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 w-fit mt-2">
              <QRCodeSVG value={qrPayload} size={60} />
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scan to Verify</p>
                 <p className="text-[10px] font-medium text-slate-600">Scan this QR code<br/>for invoice details.</p>
              </div>
            </div>
            
            {/* Bank Details */}
            {settings?.show_bank_details === 1 && settings?.bank_details_text && (
              <div className="mt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Details for Payment</h3>
                <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium">{settings.bank_details_text}</p>
              </div>
            )}
         </div>

         {/* Right Side: Totals */}
         <div className="w-[45%] ml-auto bg-slate-50 p-5 rounded-xl border border-slate-100">
            <div className="flex justify-between py-1.5 text-slate-600 text-sm">
               <span>Subtotal:</span>
               <span className="font-semibold">₹{data.subTotal.toFixed(2)}</span>
            </div>
            {data.globalDiscount > 0 && (
               <div className="flex justify-between py-1.5 text-rose-600 text-sm">
                  <span>Discount:</span>
                  <span className="font-semibold">-₹{data.globalDiscount.toFixed(2)}</span>
               </div>
            )}
            <div className="flex justify-between py-1.5 text-slate-600 text-sm border-b border-slate-200 pb-3 mb-2">
               <span>Total Tax:</span>
               <span className="font-semibold">₹{data.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-xl font-black" style={{ color: primaryColor }}>
               <span>Grand Total:</span>
               <span>₹{data.grandTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-3 mt-2">
               <span className="text-slate-800">Balance Due:</span>
               <span className={data.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                 {data.balanceDue > 0 ? `₹${data.balanceDue.toFixed(2)}` : 'PAID IN FULL'}
               </span>
            </div>
         </div>
      </div>
      
    </div>
  );
};