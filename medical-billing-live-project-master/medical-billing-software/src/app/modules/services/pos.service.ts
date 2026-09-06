import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MedicineService, Medicine } from './medicine.service';

export interface MedicineItem {
  id: number;
  code?: string;
  name: string;
  genericName?: string;
  category?: string;
  batchNo?: string;
  expiryDate?: string;
  unitPrice: number;
  mrp?: number;
  gstRate: number;
  stockQty: number;
  manufacturer?: string;
}

export interface CartItem {
  medicine: MedicineItem;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface PosInvoice {
  invoiceNo: string;
  invoiceNumber?: string;
  dateTime: string;
  invoiceDate?: string;
  storeName: string;
  storeAddress: string;
  storeGstin: string;
  storeDlNo: string;
  cashierName: string;
  patientId?: number;
  patientName: string;
  customerName?: string;
  patientMobile: string;
  customerMobile?: string;
  doctorName?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountTotal?: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Insurance' | 'Credit';
  amountReceived: number;
  changeDue: number;
  status: 'Completed' | 'Refunded';
}

@Injectable({
  providedIn: 'root'
})
export class PosService {

  private readonly STORAGE_INVOICES_KEY = 'medbill_pos_invoices';

  constructor(private medicineService: MedicineService) {}

  // Fetch medicines purely from MySQL Database
  getMedicines(companyId?: number | string): Observable<MedicineItem[]> {
    return this.medicineService.getAllMedicines(companyId).pipe(
      map((medicines: Medicine[]) => {
        return (medicines || []).map(m => ({
          id: m.id || 0,
          code: `MED-${m.id}`,
          name: m.name,
          genericName: m.genericName || '',
          category: m.category || 'Tablets',
          batchNo: m.batchNo || 'N/A',
          expiryDate: m.expiryDate || 'N/A',
          unitPrice: m.unitPrice || 0,
          mrp: m.mrp || m.unitPrice || 0,
          gstRate: m.gstRate !== undefined ? m.gstRate : 12,
          stockQty: m.stockQty !== undefined ? m.stockQty : 0,
          manufacturer: m.manufacturer || ''
        }));
      })
    );
  }

  // Generate new Invoice Number
  generateInvoiceNumber(): string {
    const today = new Date();
    const datePart = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `INV-${datePart}-${randomSeq}`;
  }

  // Save POS Invoice
  saveInvoice(invoice: PosInvoice): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_INVOICES_KEY);
      const invoices: PosInvoice[] = stored ? JSON.parse(stored) : [];
      invoices.unshift(invoice);
      localStorage.setItem(this.STORAGE_INVOICES_KEY, JSON.stringify(invoices));
      return true;
    } catch (e) {
      console.error('Error saving POS invoice:', e);
      return false;
    }
  }

  // Retrieve All Saved POS Invoices
  getInvoices(): PosInvoice[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_INVOICES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading POS invoices:', e);
      return [];
    }
  }
}
