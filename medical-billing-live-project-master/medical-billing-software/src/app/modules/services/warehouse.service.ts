import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Warehouse {
  id?: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {

  private apiUrl = 'http://localhost:8082/api/warehouses';

  constructor(private http: HttpClient) {}

  getAllWarehouses(companyId?: number | string, activeOnly: boolean = false): Observable<Warehouse[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Warehouse[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      catchError((err) => {
        console.error('Error loading warehouses from backend:', err);
        return of([] as Warehouse[]);
      })
    );
  }

  getWarehouseById(id: number): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.apiUrl}/${id}`);
  }

  createWarehouse(warehouse: Warehouse, companyId?: number | string): Observable<Warehouse> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<Warehouse>(`${this.apiUrl}?companyId=${cid}`, warehouse);
  }

  updateWarehouse(id: number, warehouse: Warehouse): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.apiUrl}/${id}`, warehouse);
  }

  deleteWarehouse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

