import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';

export interface Supplier {
  id?: number;
  name: string;
  code?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  drugLicenseNo?: string;
  creditLimit?: number;
  paymentTerms?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = 'http://localhost:8082/api/suppliers';
  private storageKey = 'pharma_suppliers_data';

  constructor(private http: HttpClient) {}

  private getInitialMockSuppliers(): Supplier[] {
    return [
      {
        id: 1,
        name: 'Apollo Healthcare Logistics',
        code: 'SUP-001',
        contactPerson: 'Ramesh Kumar',
        phone: '9841012345',
        email: 'orders@apollologistics.in',
        address: '45 Anna Salai, Guindy',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600032',
        gstin: '33AAAAA1234A1Z5',
        paymentTerms: 'Net 30 Days',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-01-15'
      },
      {
        id: 2,
        name: 'Cipla Lifesciences Distributors',
        code: 'SUP-002',
        contactPerson: 'Priya Sharma',
        phone: '9820054321',
        email: 'supply@cipladist.com',
        address: '12 BKC Complex, Bandra',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        gstin: '27AAAAA5678B1Z2',
        paymentTerms: 'Net 15 Days',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-02-01'
      },
      {
        id: 3,
        name: 'Sun Pharma Regional Hub',
        code: 'SUP-003',
        contactPerson: 'Karthik Raja',
        phone: '9790088776',
        email: 'karthik@sunpharmasupply.com',
        address: '88 Industrial Estate, Peenya',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560058',
        gstin: '29BBBBB9988C1Z9',
        paymentTerms: 'Immediate / Cash',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-02-18'
      },
      {
        id: 4,
        name: 'Dr. Reddy Labs Wholesale',
        code: 'SUP-004',
        contactPerson: 'Suresh Varma',
        phone: '9988776655',
        email: 'orders@drreddywholesale.com',
        address: '22 HITEC City, Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        gstin: '36CCCCC4433D1Z0',
        paymentTerms: 'Net 45 Days',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-03-01'
      }
    ];
  }

  private getLocalSuppliers(): Supplier[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    const initial = this.getInitialMockSuppliers();
    this.saveLocalSuppliers(initial);
    return initial;
  }

  private saveLocalSuppliers(suppliers: Supplier[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(suppliers));
    } catch (e) {
      console.error(e);
    }
  }

  getAllSuppliers(companyId?: number | string): Observable<Supplier[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Supplier[]>(`${this.apiUrl}?companyId=${cid}`).pipe(
      tap((suppliers) => {
        if (suppliers && suppliers.length > 0) {
          this.saveLocalSuppliers(suppliers);
        }
      }),
      catchError(() => {
        const local = this.getLocalSuppliers().filter(s => String(s.companyId) === String(cid) || !s.companyId);
        return of(local);
      })
    );
  }

  getSupplierById(id: number): Observable<Supplier | undefined> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        const suppliers = this.getLocalSuppliers();
        return of(suppliers.find(s => s.id === id));
      })
    );
  }

  createSupplier(supplier: Supplier, companyId?: number | string): Observable<Supplier> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    supplier.companyId = Number(cid);
    supplier.createdAt = new Date().toISOString();

    return this.http.post<Supplier>(`${this.apiUrl}?companyId=${cid}`, supplier).pipe(
      tap((saved) => {
        const list = this.getLocalSuppliers();
        list.unshift(saved);
        this.saveLocalSuppliers(list);
      }),
      catchError(() => {
        const list = this.getLocalSuppliers();
        supplier.id = Date.now();
        if (!supplier.code) {
          supplier.code = `SUP-00${list.length + 1}`;
        }
        list.unshift(supplier);
        this.saveLocalSuppliers(list);
        return of(supplier);
      })
    );
  }

  updateSupplier(id: number, supplier: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, supplier).pipe(
      tap((updated) => {
        const list = this.getLocalSuppliers();
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) {
          list[idx] = updated;
          this.saveLocalSuppliers(list);
        }
      }),
      catchError(() => {
        const list = this.getLocalSuppliers();
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...supplier, updatedAt: new Date().toISOString() };
          this.saveLocalSuppliers(list);
          return of(list[idx]);
        }
        return of(supplier);
      })
    );
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const list = this.getLocalSuppliers().filter(s => s.id !== id);
        this.saveLocalSuppliers(list);
      }),
      catchError(() => {
        const list = this.getLocalSuppliers().filter(s => s.id !== id);
        this.saveLocalSuppliers(list);
        return of(void 0);
      })
    );
  }
}

