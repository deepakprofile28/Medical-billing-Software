import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Branch {
  id?: number;
  name: string;
  branchCode?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  dlNumber?: string;
  branchManager?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BranchService {

  private apiUrl = 'http://localhost:8082/api/branches';

  constructor(private http: HttpClient) {}

  getAllBranches(companyId?: number | string, activeOnly: boolean = false): Observable<Branch[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Branch[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      catchError((err) => {
        console.error('Error loading branches from backend:', err);
        return of([] as Branch[]);
      })
    );
  }

  getBranchById(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.apiUrl}/${id}`);
  }

  createBranch(branch: Branch, companyId?: number | string): Observable<Branch> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<Branch>(`${this.apiUrl}?companyId=${cid}`, branch);
  }

  updateBranch(id: number, branch: Branch): Observable<Branch> {
    return this.http.put<Branch>(`${this.apiUrl}/${id}`, branch);
  }

  deleteBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

