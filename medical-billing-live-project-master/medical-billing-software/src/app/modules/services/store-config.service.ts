import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';

export interface StoreConfig {
  id?: number;
  storeName: string;
  storeSubtitle?: string;
  logoUrl?: string;
  currencySymbol: string;
  currencyCode: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  drugLicenseNo?: string;
  invoicePrefix?: string;
  defaultReceiptType?: 'thermal' | 'a4';
  defaultGstRate?: number;
  billGreeting?: string;
  returnPolicyTerms?: string;
  enableRoundOff?: boolean;
  companyId?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreConfigService {

  private apiUrl = 'http://localhost:8082/api/store-config';
  private readonly STORAGE_KEY = 'medbill_store_settings';

  private defaultConfig: StoreConfig = {
    storeName: 'Apollo Pharmacy Hub',
    storeSubtitle: 'Clinical & Billing Hub',
    logoUrl: '',
    currencySymbol: '₹',
    currencyCode: 'INR',
    phone: '7358441198',
    email: 'deepakprofile28@gmail.com',
    address: 'Muthu Mari Amman Koil St, Adhi Nagar, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    gstin: '33AABCA1234F1Z8',
    drugLicenseNo: 'TN/CHN/20B/2026/0091',
    invoicePrefix: 'INV-',
    defaultReceiptType: 'thermal',
    defaultGstRate: 12,
    billGreeting: '*** WISHING YOU A SPEEDY RECOVERY! GET WELL SOON ***',
    returnPolicyTerms: 'Terms: Goods once sold cannot be returned without original bill. Please check expiry before consumption.',
    enableRoundOff: true
  };

  private configSubject = new BehaviorSubject<StoreConfig>(this.loadCachedConfig());
  public config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient) {}

  private loadCachedConfig(): StoreConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...this.defaultConfig, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not parse stored config:', e);
    }
    return this.defaultConfig;
  }

  // Get configuration from backend MySQL
  getStoreConfig(companyId?: number | string): Observable<StoreConfig> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    const url = `${this.apiUrl}?companyId=${cid}`;

    return this.http.get<StoreConfig>(url).pipe(
      tap((config) => {
        if (config) {
          this.applyConfig(config);
        }
      }),
      catchError((err) => {
        console.warn('Backend store-config offline, using local cache:', err);
        return of(this.configSubject.value);
      })
    );
  }

  // Save or update configuration in backend MySQL
  saveStoreConfig(config: StoreConfig, companyId?: number | string): Observable<StoreConfig> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    const url = `${this.apiUrl}?companyId=${cid}`;

    return this.http.post<StoreConfig>(url, config).pipe(
      tap((saved) => {
        if (saved) {
          this.applyConfig(saved);
        }
      })
    );
  }

  private applyConfig(config: StoreConfig): void {
    const merged = { ...this.defaultConfig, ...config };
    this.configSubject.next(merged);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      if (merged.storeName) {
        localStorage.setItem('companyName', merged.storeName);
      }
      if (merged.currencySymbol) {
        localStorage.setItem('medbill_currency_symbol', merged.currencySymbol);
      }
    } catch (e) {
      console.warn('Error syncing config to localStorage:', e);
    }
  }

  getCurrentConfig(): StoreConfig {
    return this.configSubject.value;
  }
}

