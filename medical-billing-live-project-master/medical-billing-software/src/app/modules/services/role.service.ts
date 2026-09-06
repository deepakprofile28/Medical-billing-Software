import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Role {
  id?: number;
  roleName: string;
  designation?: string;
  accessLevel?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private apiUrl = 'http://localhost:8082/api/roles';

  constructor(private http: HttpClient) {}

  getAllRoles(companyId?: number | string, activeOnly: boolean = false): Observable<Role[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Role[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      catchError((err) => {
        console.error('Error loading roles from backend MySQL:', err);
        return of([] as Role[]);
      })
    );
  }

  getRoleById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  createRole(role: Role, companyId?: number | string): Observable<Role> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<Role>(`${this.apiUrl}?companyId=${cid}`, role);
  }

  updateRole(id: number, role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
