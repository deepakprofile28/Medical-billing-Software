import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, timeout } from 'rxjs';

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
  private storageKey = 'pharma_roles_data';
  private deletedKey = 'pharma_deleted_role_ids';

  constructor(private http: HttpClient) {}

  private getInitialMockRoles(): Role[] {
    return [
      {
        id: 1,
        roleName: 'SUPER_ADMIN',
        designation: 'Managing Director & System Super Administrator',
        accessLevel: 'Administrator Full Access',
        description: 'Complete unrestricted control over entire medical billing platform, store configurations, and financial audits.',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        roleName: 'ADMIN',
        designation: 'Pharmacy Operations Head',
        accessLevel: 'Administrator Full Access',
        description: 'Store manager with permissions to manage staff, stock procurement, suppliers, and billing operations.',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-01-05T00:00:00.000Z'
      },
      {
        id: 3,
        roleName: 'PHARMACIST',
        designation: 'Registered Pharmacist',
        accessLevel: 'Pharmacist & Counter Staff',
        description: 'Dispensary pharmacist responsible for prescription verification, medicine dispensing, and sales billing.',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-01-10T00:00:00.000Z'
      },
      {
        id: 4,
        roleName: 'CASHIER',
        designation: 'Billing Counter Operator',
        accessLevel: 'Pharmacist & Counter Staff',
        description: 'Operates point-of-sale terminal, collects cash/UPI payments, and prints patient sale invoices.',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-01-15T00:00:00.000Z'
      },
      {
        id: 5,
        roleName: 'STORE_MANAGER',
        designation: 'Warehouse & Stock Executive',
        accessLevel: 'Inventory & Store Manager',
        description: 'Handles medicine stock inwarding, purchase verification, expiry management, and supplier records.',
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-02-01T00:00:00.000Z'
      }
    ];
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
    } catch {
      // ignore
    }
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
        console.warn('Could not save deleted role id:', e);
      }
    }
  }

  getLocalRoles(): Role[] {
    const deletedIds = this.getDeletedIds();
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(r => !deletedIds.includes(Number(r.id)));
        }
      }
    } catch (e) {
      console.error('Error reading roles from localStorage:', e);
    }
    const initial = this.getInitialMockRoles().filter(r => !deletedIds.includes(Number(r.id)));
    this.saveLocalRoles(initial);
    return initial;
  }

  saveLocalRoles(roles: Role[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(roles));
    } catch (e) {
      console.warn('LocalStorage save attempt failed for roles:', e);
    }
  }

  getAllRoles(companyId?: number | string, activeOnly: boolean = false): Observable<Role[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Role[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      timeout(2000),
      tap((roles) => {
        if (roles && roles.length > 0) {
          this.saveLocalRoles(roles);
        }
      }),
      catchError(() => {
        const local = this.getLocalRoles().filter(r => {
          const matchCompany = !r.companyId || String(r.companyId) === String(cid);
          const matchActive = !activeOnly || r.status === 'ACTIVE';
          return matchCompany && matchActive;
        });
        return of(local);
      })
    );
  }

  getRoleById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`).pipe(
      timeout(2000),
      catchError(() => {
        const local = this.getLocalRoles();
        const found = local.find(r => Number(r.id) === Number(id));
        if (found) return of(found);
        return of({
          id,
          roleName: 'ROLE',
          status: 'ACTIVE'
        } as Role);
      })
    );
  }

  createRole(role: Role, companyId?: number | string): Observable<Role> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    role.companyId = Number(cid) || 1;
    if (!role.id) {
      role.id = Date.now();
    }
    if (!role.createdAt) {
      role.createdAt = new Date().toISOString();
    }

    return this.http.post<Role>(`${this.apiUrl}?companyId=${cid}`, role).pipe(
      timeout(2000),
      tap((saved) => {
        const list = this.getLocalRoles();
        list.unshift(saved || role);
        this.saveLocalRoles(list);
      }),
      catchError(() => {
        const list = this.getLocalRoles();
        const exists = list.find(r => Number(r.id) === Number(role.id));
        if (!exists) {
          list.unshift(role);
        }
        this.saveLocalRoles(list);
        return of(role);
      })
    );
  }

  updateRole(id: number, role: Role): Observable<Role> {
    role.id = id;
    role.updatedAt = new Date().toISOString();

    return this.http.put<Role>(`${this.apiUrl}/${id}`, role).pipe(
      timeout(2000),
      tap((updated) => {
        const list = this.getLocalRoles();
        const idx = list.findIndex(r => Number(r.id) === Number(id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updated };
          this.saveLocalRoles(list);
        }
      }),
      catchError(() => {
        const list = this.getLocalRoles();
        const idx = list.findIndex(r => Number(r.id) === Number(id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...role };
          this.saveLocalRoles(list);
          return of(list[idx]);
        }
        return of(role);
      })
    );
  }

  deleteRole(id: number | string): Observable<void> {
    const numId = Number(id);
    const strId = String(id);

    // 1. Immediately record in persistent deleted IDs
    this.markAsDeleted(numId);

    // 2. Immediately remove from local roles
    const current = this.getLocalRoles();
    const filtered = current.filter(r => Number(r.id) !== numId && String(r.id) !== strId);
    this.saveLocalRoles(filtered);

    // 3. Dispatch HTTP delete
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      timeout(1000),
      catchError(() => of(void 0))
    );
  }
}
