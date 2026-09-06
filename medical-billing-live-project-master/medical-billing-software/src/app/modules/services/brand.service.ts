import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Brand {
  id?: number;
  name: string;
  code?: string;
  manufacturer?: string;
  description?: string;
  logoUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {

  private apiUrl = 'http://localhost:8082/api/brands';

  constructor(private http: HttpClient) {}

  getAllBrands(companyId?: number | string, activeOnly: boolean = false): Observable<Brand[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Brand[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      catchError((err) => {
        console.error('Error loading brands from backend:', err);
        return of([] as Brand[]);
      })
    );
  }

  getBrandById(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/${id}`);
  }

  createBrand(brand: Brand, companyId?: number | string): Observable<Brand> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<Brand>(`${this.apiUrl}?companyId=${cid}`, brand);
  }

  updateBrand(id: number, brand: Brand): Observable<Brand> {
    return this.http.put<Brand>(`${this.apiUrl}/${id}`, brand);
  }

  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

