import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';

export interface PurchaseItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface Purchase {
  id?: number;
  purchaseNo: string;
  supplierName: string;
  warehouseId: number | string;
  warehouseName?: string;
  totalAmount: number;
  purchaseDate?: string;
  items: PurchaseItem[];
  companyId?: number | string;
}

export interface PurchaseReturnItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  reason?: string;
}

export interface PurchaseReturn {
  id?: number;
  returnNo: string;
  purchaseNo?: string;
  supplierName: string;
  warehouseId?: number | string;
  warehouseName?: string;
  totalAmount: number;
  returnDate?: string;
  reason?: string;
  status?: string;
  items: PurchaseReturnItem[];
  companyId?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private apiUrl = 'http://localhost:8082/api/purchases';
  private returnsUrl = 'http://localhost:8082/api/purchase-returns';

  private purchasesStorageKey = 'pharma_purchases_cache';
  private returnsStorageKey = 'pharma_purchase_returns_cache';

  constructor(private http: HttpClient) {}

  private getInitialPurchases(): Purchase[] {
    return [
      {
        id: 1,
        purchaseNo: 'PUR-1001',
        supplierName: 'Apollo Healthcare Logistics',
        warehouseId: 1,
        warehouseName: 'Main Warehouse',
        totalAmount: 15400,
        purchaseDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        items: [
          { productId: 1, productName: 'Paracetamol 500mg', quantity: 500, unitPrice: 15, subtotal: 7500 },
          { productId: 2, productName: 'Amoxicillin 250mg', quantity: 200, unitPrice: 28, subtotal: 5600 },
          { productId: 3, productName: 'Cetirizine 10mg', quantity: 230, unitPrice: 10, subtotal: 2300 }
        ],
        companyId: 1
      },
      {
        id: 2,
        purchaseNo: 'PUR-1002',
        supplierName: 'Cipla Lifesciences Distributors',
        warehouseId: 2,
        warehouseName: 'Branch A',
        totalAmount: 28500,
        purchaseDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        items: [
          { productId: 4, productName: 'Azithromycin 500mg', quantity: 300, unitPrice: 65, subtotal: 19500 },
          { productId: 5, productName: 'Pantoprazole 40mg', quantity: 200, unitPrice: 45, subtotal: 9000 }
        ],
        companyId: 1
      },
      {
        id: 3,
        purchaseNo: 'PUR-1003',
        supplierName: 'Sun Pharma Regional Hub',
        warehouseId: 1,
        warehouseName: 'Main Warehouse',
        totalAmount: 9800,
        purchaseDate: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
        items: [
          { productId: 6, productName: 'Metformin 500mg', quantity: 400, unitPrice: 24.5, subtotal: 9800 }
        ],
        companyId: 1
      }
    ];
  }

  private getInitialReturns(): PurchaseReturn[] {
    return [
      {
        id: 1,
        returnNo: 'PRTN-1001',
        purchaseNo: 'PUR-1001',
        supplierName: 'Apollo Healthcare Logistics',
        warehouseId: 1,
        warehouseName: 'Main Warehouse',
        totalAmount: 2250,
        returnDate: new Date(Date.now() - 3600000 * 24).toISOString(),
        reason: 'Damaged in Transit',
        status: 'Completed',
        items: [
          { productId: 1, productName: 'Paracetamol 500mg', quantity: 150, unitPrice: 15, subtotal: 2250, reason: 'Broken ampoules' }
        ],
        companyId: 1
      },
      {
        id: 2,
        returnNo: 'PRTN-1002',
        purchaseNo: 'PUR-1002',
        supplierName: 'Cipla Lifesciences Distributors',
        warehouseId: 2,
        warehouseName: 'Branch A',
        totalAmount: 3400,
        returnDate: new Date(Date.now() - 3600000 * 12).toISOString(),
        reason: 'Expired Product',
        status: 'Completed',
        items: [
          { productId: 5, productName: 'Pantoprazole 40mg', quantity: 75, unitPrice: 45, subtotal: 3375, reason: 'Short expiry date' }
        ],
        companyId: 1
      }
    ];
  }

  private getLocalPurchases(): Purchase[] {
    try {
      const data = localStorage.getItem(this.purchasesStorageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    const initial = this.getInitialPurchases();
    this.saveLocalPurchases(initial);
    return initial;
  }

  private saveLocalPurchases(list: Purchase[]): void {
    try {
      localStorage.setItem(this.purchasesStorageKey, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }

  private getLocalReturns(): PurchaseReturn[] {
    try {
      const data = localStorage.getItem(this.returnsStorageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    const initial = this.getInitialReturns();
    this.saveLocalReturns(initial);
    return initial;
  }

  private saveLocalReturns(list: PurchaseReturn[]): void {
    try {
      localStorage.setItem(this.returnsStorageKey, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }

  getPurchases(companyId?: string | number): Observable<Purchase[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Purchase[]>(`${this.apiUrl}?companyId=${cid}`).pipe(
      tap((data) => {
        if (data && data.length > 0) {
          this.saveLocalPurchases(data);
        }
      }),
      catchError(() => {
        const local = this.getLocalPurchases();
        return of(local);
      })
    );
  }

  createPurchase(purchase: Purchase): Observable<Purchase> {
    const cid = purchase.companyId || localStorage.getItem('companyId') || '1';
    purchase.companyId = cid;
    purchase.purchaseDate = purchase.purchaseDate || new Date().toISOString();

    return this.http.post<Purchase>(this.apiUrl, purchase).pipe(
      tap((created) => {
        const list = this.getLocalPurchases();
        list.unshift(created);
        this.saveLocalPurchases(list);
      }),
      catchError((err) => {
        console.warn('Backend createPurchase failed, saving locally', err);
        const list = this.getLocalPurchases();
        const saved: Purchase = {
          ...purchase,
          id: Date.now(),
          purchaseDate: new Date().toISOString()
        };
        list.unshift(saved);
        this.saveLocalPurchases(list);
        return of(saved);
      })
    );
  }

  getPurchaseReturns(companyId?: string | number): Observable<PurchaseReturn[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<PurchaseReturn[]>(`${this.returnsUrl}?companyId=${cid}`).pipe(
      tap((data) => {
        if (data && data.length > 0) {
          this.saveLocalReturns(data);
        }
      }),
      catchError(() => {
        const local = this.getLocalReturns();
        return of(local);
      })
    );
  }

  createPurchaseReturn(purchaseReturn: PurchaseReturn): Observable<PurchaseReturn> {
    const cid = purchaseReturn.companyId || localStorage.getItem('companyId') || '1';
    purchaseReturn.companyId = cid;
    purchaseReturn.returnDate = purchaseReturn.returnDate || new Date().toISOString();

    return this.http.post<PurchaseReturn>(this.returnsUrl, purchaseReturn).pipe(
      tap((created) => {
        const list = this.getLocalReturns();
        list.unshift(created);
        this.saveLocalReturns(list);
      }),
      catchError((err) => {
        console.warn('Backend createPurchaseReturn failed, saving locally', err);
        const list = this.getLocalReturns();
        const saved: PurchaseReturn = {
          ...purchaseReturn,
          id: Date.now(),
          returnDate: new Date().toISOString(),
          status: 'Completed'
        };
        list.unshift(saved);
        this.saveLocalReturns(list);
        return of(saved);
      })
    );
  }
}
