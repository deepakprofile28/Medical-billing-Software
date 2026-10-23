import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductAlert {
  id: number;
  name: string;
  genericName?: string;
  category?: string;
  batchNo?: string;
  expiryDate?: string;
  unitPrice?: number;
  mrp?: number;
  stockQty: number;
  alertQuantity: number;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ADEQUATE';
  reorderQty: number;
  manufacturer?: string;
  companyId?: number;
}

export interface AlertSummary {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  adequateStockCount: number;
  totalAlertsCount: number;
  totalUnits: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertQuantityService {
  private apiUrl = 'http://localhost:8082/api/alert-quantity';

  constructor(private http: HttpClient) {}

  getAlerts(companyId?: number | string, status?: string): Observable<ProductAlert[]> {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', companyId.toString());
    }
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }
    return this.http.get<ProductAlert[]>(this.apiUrl, { params });
  }

  getSummary(companyId?: number | string): Observable<AlertSummary> {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', companyId.toString());
    }
    return this.http.get<AlertSummary>(`${this.apiUrl}/summary`, { params });
  }

  updateAlertQuantity(id: number, alertQuantity: number): Observable<ProductAlert> {
    const params = new HttpParams().set('alertQuantity', alertQuantity.toString());
    return this.http.put<ProductAlert>(`${this.apiUrl}/${id}`, null, { params });
  }

  bulkSetAlertQuantity(alertQuantity: number, companyId?: number | string, category?: string): Observable<{ updatedCount: number; message: string }> {
    let params = new HttpParams().set('alertQuantity', alertQuantity.toString());
    if (companyId) {
      params = params.set('companyId', companyId.toString());
    }
    if (category) {
      params = params.set('category', category);
    }
    return this.http.post<{ updatedCount: number; message: string }>(`${this.apiUrl}/bulk-set`, null, { params });
  }
}

