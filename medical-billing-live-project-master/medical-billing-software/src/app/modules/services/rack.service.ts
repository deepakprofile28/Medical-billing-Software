import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Rack {
  id?: number;
  name: string;
  description?: string;
  warehouseId?: number | string;
  companyId?: number | string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RackService {
  private apiUrl = 'http://localhost:8082/api/racks';

  constructor(private http: HttpClient) {}

  getRacks(companyId?: string | number, activeOnly: boolean = false): Observable<Rack[]> {
    let url = this.apiUrl;
    if (companyId) {
      url += `?companyId=${companyId}&activeOnly=${activeOnly}`;
    }
    return this.http.get<Rack[]>(url).pipe(
      catchError((err) => {
        console.error('Failed to load racks', err);
        return of([]);
      })
    );
  }

  getRacksByWarehouse(warehouseId: string | number): Observable<Rack[]> {
    return this.http.get<Rack[]>(`${this.apiUrl}/warehouse/${warehouseId}`).pipe(
      catchError(() => of([]))
    );
  }

  getRack(id: number): Observable<Rack> {
    return this.http.get<Rack>(`${this.apiUrl}/${id}`);
  }

  createRack(rack: Rack): Observable<Rack> {
    return this.http.post<Rack>(this.apiUrl, rack);
  }

  updateRack(id: number, rack: Rack): Observable<Rack> {
    return this.http.put<Rack>(`${this.apiUrl}/${id}`, rack);
  }

  deleteRack(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
