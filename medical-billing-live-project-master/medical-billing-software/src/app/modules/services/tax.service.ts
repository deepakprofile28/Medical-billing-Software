import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface TaxConfiguration {
  id?: number;
  taxName: string;
  gstRate: number;
  cgstRate?: number;
  sgstRate?: number;
  taxType: 'EXCLUSIVE' | 'INCLUSIVE';
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxCalculationRequest {
  amount: number;
  quantity?: number;
  discountPercent?: number;
  gstRate?: number;
  taxType?: 'EXCLUSIVE' | 'INCLUSIVE';
  taxId?: number;
}

export interface TaxCalculationResult {
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTaxAmount: number;
  netTotal: number;
  taxType: string;
  formulaDescription: string;
}

export interface InvoiceTaxCalculationRequest {
  items: TaxCalculationRequest[];
  overallDiscountPercent?: number;
  enableRoundOff?: boolean;
}

export interface InvoiceTaxCalculationResult {
  grossSubtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  roundOffDifference: number;
  grandTotal: number;
  calculatedItems: TaxCalculationResult[];
  taxSlabBreakdown: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {

  private apiUrl = 'http://localhost:8082/api/taxes';

  constructor(private http: HttpClient) {}

  getAllTaxes(companyId?: number | string): Observable<TaxConfiguration[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<TaxConfiguration[]>(`${this.apiUrl}?companyId=${cid}`).pipe(
      catchError((err) => {
        console.error('Error loading taxes from backend MySQL:', err);
        return of([] as TaxConfiguration[]);
      })
    );
  }

  getTaxById(id: number): Observable<TaxConfiguration> {
    return this.http.get<TaxConfiguration>(`${this.apiUrl}/${id}`);
  }

  createTax(tax: TaxConfiguration, companyId?: number | string): Observable<TaxConfiguration> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<TaxConfiguration>(`${this.apiUrl}?companyId=${cid}`, tax);
  }

  updateTax(id: number, tax: TaxConfiguration): Observable<TaxConfiguration> {
    return this.http.put<TaxConfiguration>(`${this.apiUrl}/${id}`, tax);
  }

  deleteTax(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // BACKEND CALCULATION APIs (INCLUSIVE & EXCLUSIVE)
  // ==========================================
  calculateItemTax(request: TaxCalculationRequest): Observable<TaxCalculationResult> {
    return this.http.post<TaxCalculationResult>(`${this.apiUrl}/calculate`, request);
  }

  calculateInvoiceTax(request: InvoiceTaxCalculationRequest): Observable<InvoiceTaxCalculationResult> {
    return this.http.post<InvoiceTaxCalculationResult>(`${this.apiUrl}/calculate-invoice`, request);
  }
}
