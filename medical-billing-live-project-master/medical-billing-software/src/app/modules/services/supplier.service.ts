import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, timeout } from 'rxjs';

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
  panNumber?: string;
  fssaiLicenseNo?: string;
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

  // Attached Compliance & Regulatory Documents (Base64 data / URL)
  gstCertificate?: string;
  gstCertificateName?: string;
  drugLicenseDoc?: string;
  drugLicenseDocName?: string;
  panDoc?: string;
  panDocName?: string;
  fssaiDoc?: string;
  fssaiDocName?: string;
  visitingCardDoc?: string;
  visitingCardDocName?: string;
  chequeDoc?: string;
  chequeDocName?: string;
  agreementDoc?: string;
  agreementDocName?: string;
}

export const SUPPLIER_DOC_KEYS: (keyof Supplier)[] = [
  'gstCertificate',
  'drugLicenseDoc',
  'panDoc',
  'fssaiDoc',
  'visitingCardDoc',
  'chequeDoc',
  'agreementDoc'
];

const DB_NAME = 'PharmaCareDocDB';
const DB_VERSION = 1;
const STORE_NAME = 'supplier_docs';

function openDocDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setDocInIDB(id: string, dataUrl: string, name: string): Promise<void> {
  try {
    const db = await openDocDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, dataUrl, name, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save document to IndexedDB:', err);
  }
}

async function getDocFromIDB(id: string): Promise<{ id: string; dataUrl: string; name: string } | undefined> {
  try {
    const db = await openDocDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read document from IndexedDB:', err);
    return undefined;
  }
}

async function deleteDocFromIDB(id: string): Promise<void> {
  try {
    const db = await openDocDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete document from IndexedDB:', err);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = 'http://localhost:8082/api/suppliers';
  private storageKey = 'pharma_suppliers_data';
  private deletedKey = 'pharma_deleted_supplier_ids';

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

  private docCache = new Map<string, { dataUrl: string; name: string }>();

  /**
   * Offloads large base64 documents into IndexedDB and memory cache,
   * replacing them in the returned object with lightweight 'idb:doc_...' references.
   */
  offloadDocuments(supplier: Supplier): Supplier {
    const cloned: any = { ...supplier };
    const sId = supplier.id || supplier.code || Date.now();

    for (const docKey of SUPPLIER_DOC_KEYS) {
      const val = cloned[docKey];
      const nameKey = `${String(docKey)}Name` as keyof Supplier;
      const fileName = (cloned[nameKey] as string) || 'document';

      if (typeof val === 'string' && val.startsWith('data:')) {
        const docToken = `doc_${sId}_${String(docKey)}`;
        // 1. Save to in-memory runtime cache for instant access
        this.docCache.set(docToken, { dataUrl: val, name: fileName });
        // 2. Persist in HTML5 IndexedDB asynchronously
        setDocInIDB(docToken, val, fileName);
        // 3. Store lightweight reference token in object to keep localStorage minimal
        cloned[docKey] = `idb:${docToken}`;
      }
    }

    return cloned;
  }

  /**
   * Resolves a document token (idb:...) to its actual dataUrl / URL
   * using memory cache and IndexedDB fallback.
   */
  async resolveDocument(docRef?: string, supplierId?: number | string, docField?: string): Promise<string | undefined> {
    if (!docRef) {
      if (supplierId && docField) {
        const fallbackToken = `doc_${supplierId}_${docField}`;
        if (this.docCache.has(fallbackToken)) {
          return this.docCache.get(fallbackToken)?.dataUrl;
        }
        const record = await getDocFromIDB(fallbackToken);
        if (record?.dataUrl) {
          this.docCache.set(fallbackToken, record);
          return record.dataUrl;
        }
      }
      return undefined;
    }

    // Direct base64 data URI, HTTP URL, or Blob URL
    if (docRef.startsWith('data:') || docRef.startsWith('http') || docRef.startsWith('blob:')) {
      return docRef;
    }

    // IndexedDB reference token
    if (docRef.startsWith('idb:')) {
      const key = docRef.substring(4);
      if (this.docCache.has(key)) {
        return this.docCache.get(key)?.dataUrl;
      }
      const record = await getDocFromIDB(key);
      if (record?.dataUrl) {
        this.docCache.set(key, record);
        return record.dataUrl;
      }
    }

    return docRef;
  }

  getDeletedIds(): number[] {
    try {
      const data = localStorage.getItem(this.deletedKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map(Number);
        }
      }
    } catch {}
    return [];
  }

  markAsDeleted(id: number | string): void {
    const numId = Number(id);
    const deleted = this.getDeletedIds();
    if (!deleted.includes(numId)) {
      deleted.push(numId);
      try {
        localStorage.setItem(this.deletedKey, JSON.stringify(deleted));
      } catch (e) {
        console.warn('Could not save deleted supplier id:', e);
      }
    }
  }

  generateUniqueSupplierCode(): string {
    const currentList = this.getLocalSuppliers();
    let maxNum = 0;
    for (const s of currentList) {
      if (s.code) {
        const m = s.code.match(/(\d+)/);
        if (m) {
          const val = parseInt(m[1], 10);
          if (val > maxNum && val < 999999) {
            maxNum = val;
          }
        }
      }
      if (s.id && typeof s.id === 'number' && s.id < 999999) {
        if (s.id > maxNum) {
          maxNum = s.id;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `SUP-${String(nextNum).padStart(3, '0')}`;
  }

  getLocalSuppliers(): Supplier[] {
    const deletedIds = this.getDeletedIds();
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => !deletedIds.includes(Number(s.id)));
        }
      }
    } catch (e) {
      console.error('Error reading suppliers from localStorage:', e);
    }
    const initial = this.getInitialMockSuppliers().filter(s => !deletedIds.includes(Number(s.id)));
    this.saveLocalSuppliers(initial);
    return initial;
  }

  private saveLocalSuppliers(suppliers: Supplier[]): void {
    try {
      const sanitized = suppliers.map(s => this.offloadDocuments(s));
      localStorage.setItem(this.storageKey, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('LocalStorage save attempt failed, applying emergency quota-safe cleanup:', e);
      try {
        const emergencyClean = suppliers.map(s => {
          const clean: any = { ...s };
          for (const key of SUPPLIER_DOC_KEYS) {
            if (typeof clean[key] === 'string' && clean[key].startsWith('data:')) {
              clean[key] = `idb:doc_${s.id || s.code}_${String(key)}`;
            }
          }
          return clean;
        });
        localStorage.setItem(this.storageKey, JSON.stringify(emergencyClean));
      } catch (err) {
        console.error('Critical: Failed to save suppliers to localStorage:', err);
      }
    }
  }

  getAllSuppliers(companyId?: number | string): Observable<Supplier[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    const deletedIds = this.getDeletedIds();
    return this.http.get<Supplier[]>(`${this.apiUrl}?companyId=${cid}`).pipe(
      timeout(2000),
      tap((suppliers) => {
        if (suppliers && suppliers.length > 0) {
          const sanitized = suppliers.filter(s => !deletedIds.includes(Number(s.id)));
          this.saveLocalSuppliers(sanitized);
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
      timeout(2000),
      catchError(() => {
        const suppliers = this.getLocalSuppliers();
        return of(suppliers.find(s => Number(s.id) === Number(id)));
      })
    );
  }

  createSupplier(supplier: Supplier, companyId?: number | string): Observable<Supplier> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    supplier.companyId = Number(cid);
    supplier.createdAt = new Date().toISOString();
    
    // Ensure unique Supplier Code if not provided
    if (!supplier.code || !supplier.code.trim()) {
      supplier.code = this.generateUniqueSupplierCode();
    }

    // Prepare backend payload for Spring Boot REST API
    // Omit `id` so Spring Boot / JPA detects it as a NEW entity and MySQL auto-generates the primary key!
    const backendPayload: any = { ...supplier };
    delete backendPayload.id;

    // Clean bulky base64 data for HTTP transmission
    for (const docKey of SUPPLIER_DOC_KEYS) {
      const val = backendPayload[docKey];
      if (typeof val === 'string' && val.startsWith('data:')) {
        backendPayload[docKey] = null;
      }
    }

    return this.http.post<Supplier>(`${this.apiUrl}?companyId=${cid}`, backendPayload).pipe(
      timeout(2000),
      tap((saved) => {
        // Backend successfully created entry in MySQL!
        const finalSupplier: Supplier = {
          ...supplier,
          ...saved,
          id: saved?.id || supplier.id || Date.now()
        };
        const list = this.getLocalSuppliers();
        list.unshift(finalSupplier);
        this.saveLocalSuppliers(list);
      }),
      catchError(() => {
        // Offline fallback - assign local ID and persist
        if (!supplier.id) {
          supplier.id = Date.now();
        }
        const list = this.getLocalSuppliers();
        const exists = list.find(s => Number(s.id) === Number(supplier.id));
        if (!exists) {
          list.unshift(supplier);
        }
        this.saveLocalSuppliers(list);
        return of(supplier);
      })
    );
  }

  updateSupplier(id: number, supplier: Supplier): Observable<Supplier> {
    const backendPayload: any = { ...supplier, id };
    for (const docKey of SUPPLIER_DOC_KEYS) {
      const val = backendPayload[docKey];
      if (typeof val === 'string' && val.startsWith('data:')) {
        backendPayload[docKey] = null;
      }
    }

    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, backendPayload).pipe(
      timeout(2000),
      tap((updated) => {
        const list = this.getLocalSuppliers();
        const idx = list.findIndex(s => Number(s.id) === Number(id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...supplier, ...updated };
          this.saveLocalSuppliers(list);
        }
      }),
      catchError(() => {
        const list = this.getLocalSuppliers();
        const idx = list.findIndex(s => Number(s.id) === Number(id));
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
    const numId = Number(id);

    // 1. Mark as deleted in persistent storage
    this.markAsDeleted(numId);

    // 2. Clean up associated IndexedDB docs
    for (const key of SUPPLIER_DOC_KEYS) {
      const docToken = `doc_${id}_${String(key)}`;
      deleteDocFromIDB(docToken);
      this.docCache.delete(docToken);
    }

    // 3. Immediately remove from local suppliers
    const list = this.getLocalSuppliers().filter(s => Number(s.id) !== numId);
    this.saveLocalSuppliers(list);

    // 4. Dispatch backend HTTP delete
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      timeout(1000),
      catchError(() => of(void 0))
    );
  }
}

