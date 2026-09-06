import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Category {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  position?: number;
  status: 'ACTIVE' | 'INACTIVE';
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl = 'http://localhost:8082/api/categories';

  constructor(private http: HttpClient) {}

  getAllCategories(companyId?: number | string, activeOnly: boolean = false): Observable<Category[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Category[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      catchError((err) => {
        console.error('Error loading categories from backend MySQL:', err);
        return of([] as Category[]);
      })
    );
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: Category, companyId?: number | string): Observable<Category> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<Category>(`${this.apiUrl}?companyId=${cid}`, category);
  }

  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

