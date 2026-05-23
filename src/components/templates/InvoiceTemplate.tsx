import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { InvoiceData } from '../../types/invoice';

export function InvoiceTemplate({ type, data, settings }: { type: string, data: InvoiceData | any, settings: any }) {
  const isPaid = data.balanceDue <= 0;
  console.log("Rendering InvoiceTemplate with data:", data, "and settings:", settings);
  const paddingClass = settings?.spacing === 'compact' ? 'p-6' : settings?.spacing === 'relaxed' ? 'p-10' : 'p-8';
  const tableCellPad = settings?.spacing === 'compact' ? 'py-2 px-3' : 'py-3 px-3';
  
  // Safely fallback for invoice number depending on where the data came from (Live vs History)
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
      <div className="flex justify-between items-start border-b-2 pb-6 mb-6 gap-6 avoid-break" style={{ borderColor: settings?.primary_color || '#2563EB' }}>
        <div className="flex gap-5 items-center flex-1 min-w-0">
          {data.companyDetails?.logo_base64 && (
            <img src={data.companyDetails.logo_base64} alt="Logo" className="w-24 h-24 object-contain rounded-xl border border-slate-100 p-2 shrink-0 bg-white" />
          )}
          <div className="min-w-0 w-full">
            <h1 className="text-3xl font-black tracking-tight uppercase break-words leading-tight" style={{ color: settings?.primary_color || '#1e293b' }}>
              {data.companyDetails?.business_name || 'Your Company Name'}
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed break-words pr-4">
              {data.companyDetails?.address || 'Company Address Not Set'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-600">
              {data.companyDetails?.phone && <span><strong className="text-slate-400 font-medium">Ph:</strong> {data.companyDetails.phone}</span>}
              {data.companyDetails?.email && <span><strong className="text-slate-400 font-medium">Email:</strong> {data.companyDetails.email}</span>}
            </div>
            {data.companyDetails?.gst_number && (
              <div className="inline-block mt-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-600 uppercase tracking-wider">
                GSTIN: {data.companyDetails.gst_number}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right shrink-0 flex flex-col items-end">
          <h2 className="text-2xl font-bold uppercase tracking-widest mb-3" style={{ color: settings?.primary_color || '#94a3b8' }}>
            {type === 'Sale' ? 'TAX INVOICE' : 'PURCHASE'}
          </h2>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl min-w-[140px] text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice No.</p>
            <p className="text-sm font-bold text-slate-800 mb-2">{displayInvoiceNo}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
            <p className="text-sm font-bold text-slate-800">{data.date}</p>
          </div>
        </div>
      </div>

      {/* BILLED TO */}
      <div className="flex justify-between mb-8 bg-slate-50 border border-slate-100 rounded-xl p-5 avoid-break">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            Billed To
            <span className="h-px bg-slate-200 flex-1"></span>
          </h3>
          <p className="text-xl font-bold text-slate-800 capitalize break-words">{data.partyName || 'Cash Customer'}</p>
          {data.phone && <p className="text-sm text-slate-600 mt-1">Phone: {data.phone}</p>}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-6 flex-1 w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white text-xs uppercase tracking-wider" style={{ backgroundColor: settings?.primary_color || '#1e293b' }}>
              <th className={`${tableCellPad} w-10 text-center rounded-tl-lg font-medium`}>#</th>
              <th className={`${tableCellPad} font-medium`}>Item Description</th>
              {/* NEW COLUMN FOR SERIAL NUMBER */}
              <th className={`${tableCellPad} w-28 font-medium`}>Serial No.</th>
              <th className={`${tableCellPad} w-16 text-center font-medium whitespace-nowrap`}>Qty</th>
              <th className={`${tableCellPad} w-24 text-right font-medium whitespace-nowrap`}>Rate</th>
              {settings?.show_discount_column === 1 && <th className={`${tableCellPad} w-20 text-right font-medium whitespace-nowrap`}>Disc.</th>}
              {settings?.show_tax_column === 1 && <th className={`${tableCellPad} w-20 text-center font-medium whitespace-nowrap`}>Tax</th>}
              <th className={`${tableCellPad} w-28 text-right font-medium whitespace-nowrap rounded-tr-lg`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any, index: number) => {
              const itemSerial = item.serialNo || item.serial_no || '';
              
              return (
                <tr key={index} className="border-b border-slate-100 text-sm avoid-break">
                  <td className={`${tableCellPad} text-center text-slate-600 align-top`}>{index + 1}</td>
                  
                  <td className={`${tableCellPad} font-medium text-slate-800 break-words align-top`}>
                    {item.name || item.item_name}
                  </td>
                  
                  {/* DEDICATED SERIAL NUMBER CELL */}
                  <td className={`${tableCellPad} text-slate-600 break-words align-top font-mono text-xs`}>
                    {itemSerial ? itemSerial : <span className="text-slate-300">-</span>}
                  </td>
                  
                  <td className={`${tableCellPad} text-center text-slate-700 align-top`}>{item.qty}</td>
                  <td className={`${tableCellPad} text-right text-slate-700 whitespace-nowrap align-top`}>{Number(item.price || 0).toFixed(2)}</td>
                  {settings?.show_discount_column === 1 && <td className={`${tableCellPad} text-right text-slate-500 whitespace-nowrap align-top`}>{item.discount > 0 ? `${item.discount}` : '-'}</td>}
                  {settings?.show_tax_column === 1 && <td className={`${tableCellPad} text-center text-slate-500 whitespace-nowrap align-top`}>{item.taxRate > 0 ? `${item.taxRate}%` : 'NIL'}</td>}
                  <td className={`${tableCellPad} text-right font-bold text-slate-800 whitespace-nowrap align-top`}>{Number(item.amount || 0).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-start pt-6 border-t border-slate-200 gap-8 mt-auto avoid-break w-full">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {settings?.show_notes === 1 && data.notes && (
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium break-words leading-relaxed">{data.notes}</p>
            </div>
          )}

          {settings?.custom_terms && (
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Terms & Conditions</h3>
              <p className="text-xs text-slate-500 whitespace-pre-wrap break-words leading-relaxed">{settings.custom_terms}</p>
            </div>
          )}

          {settings?.show_bank_details === 1 && settings?.bank_details_text && (
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg avoid-break">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank Details</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium break-words">{settings.bank_details_text}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3 w-fit mt-auto avoid-break">
              <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                <QRCodeSVG value={qrPayload} size={56} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Scan to Verify</p>
                <p className="text-xs font-medium text-slate-500 leading-tight">Authentic<br/>Digital Record</p>
              </div>
          </div>
        </div>
        
        <div className="w-[320px] shrink-0 bg-slate-50 border border-slate-100 rounded-2xl p-6 avoid-break">
          <div className="flex justify-between text-sm mb-3 text-slate-600">
            <span>Sub Total</span><span className="font-semibold whitespace-nowrap">{data.subTotal.toFixed(2)}</span>
          </div>
          
          {data.globalDiscount > 0 && (
            <div className="flex justify-between text-sm mb-3 text-rose-500">
                <span>Discount</span><span className="font-semibold whitespace-nowrap">- {data.globalDiscount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm mb-3 text-slate-600">
            <span>Total Tax</span><span className="font-semibold whitespace-nowrap">{data.totalTax.toFixed(2)}</span>
          </div>
          
          {data.roundOff !== 0 && (
            <div className="flex justify-between text-sm mb-4 text-slate-500">
                <span>Round Off</span><span className="font-semibold whitespace-nowrap">{data.roundOff > 0 ? '+' : ''} {data.roundOff.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center border-t border-slate-200 pt-4 mb-4">
            <span className="text-base font-bold text-slate-800">Grand Total</span>
            <span className="text-2xl font-black whitespace-nowrap" style={{ color: settings?.primary_color || '#1e293b' }}>{data.grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-3">
            <span className="text-slate-600">Balance Due</span>
            <span className={`whitespace-nowrap px-3 py-1 rounded-full text-xs tracking-wide ${data.balanceDue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {data.balanceDue > 0 ? `${data.balanceDue.toFixed(2)}` : 'PAID'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}