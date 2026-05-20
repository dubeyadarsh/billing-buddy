export interface InvoiceData {
  type?: 'Sale' | 'Purchase';
  billNo: string;
  date: string;
  partyName: string;
  phone?: string;
  stateOfSupply?: string;
  companyDetails: any; // Contains business_name, logo_base64, address, gst_number, etc.
  items: Array<{ id: number; name: string; qty: number; price: number; discount: number; taxRate: number; amount: number }>;
  subTotal: number;
  globalDiscount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  notes: string;
}