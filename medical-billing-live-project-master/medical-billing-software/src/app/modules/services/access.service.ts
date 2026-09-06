import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, of } from 'rxjs';

export interface ModulePermissionRow {
  code: string;
  name: string;
  route: string;
  icon: string;
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

export interface ModuleSection {
  title: string;
  icon: string;
  rows: ModulePermissionRow[];
}

export interface AccessPermission {
  id?: number;
  name: string;
  description?: string;
  posPermissions?: string;
  modulePermissions?: string;
  status: 'ACTIVE' | 'INACTIVE';
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

// Completed pages and modules in this application (All enabled by default)
export const COMPLETED_MODULE_SECTIONS: ModuleSection[] = [
  {
    title: 'POINT OF SALE & BILLING',
    icon: 'bi-receipt-cutoff',
    rows: [
      {
        code: 'POS_BILLING',
        name: 'POS Billing Counter',
        route: '/pos',
        icon: 'bi-cart-check-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      }
    ]
  },
  {
    title: 'MEDICINES & INVENTORY',
    icon: 'bi-capsule-pill',
    rows: [
      {
        code: 'TABLETS',
        name: 'Tablets & Medicine Inventory',
        route: '/tablets',
        icon: 'bi-capsule',
        read: true,
        write: true,
        update: true,
        delete: true
      },
      {
        code: 'CATEGORIES',
        name: 'Medicine Categories',
        route: '/category-settings',
        icon: 'bi-tags-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      }
    ]
  },
  {
    title: 'PATIENT MANAGEMENT',
    icon: 'bi-person-vcard-fill',
    rows: [
      {
        code: 'PATIENT_REGISTRATION',
        name: 'Patient Registration',
        route: '/patient-registration',
        icon: 'bi-person-plus-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      },
      {
        code: 'PATIENT_LIST',
        name: 'Patient Directory & List',
        route: '/patient-list',
        icon: 'bi-people-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      },
      {
        code: 'PATIENT_DETAILS',
        name: 'Patient Clinical Details',
        route: '/patient-details',
        icon: 'bi-file-medical-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      }
    ]
  },
  {
    title: 'DOCTOR MANAGEMENT',
    icon: 'bi-person-badge-fill',
    rows: [
      {
        code: 'DOCTORS',
        name: 'Doctor Management & Directory',
        route: '/doctors',
        icon: 'bi-person-badge',
        read: true,
        write: true,
        update: true,
        delete: true
      }
    ]
  },
  {
    title: 'CLINICAL & AI INTELLIGENCE',
    icon: 'bi-robot',
    rows: [
      {
        code: 'AI_ASSISTANT',
        name: 'AI Medical Assistant',
        route: '/ai-assistant',
        icon: 'bi-cpu-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      }
    ]
  },
  {
    title: 'STAFF & SECURITY',
    icon: 'bi-shield-lock-fill',
    rows: [
      {
        code: 'USER_MANAGEMENT',
        name: 'User Management & Staff',
        route: '/users',
        icon: 'bi-person-gear',
        read: true,
        write: true,
        update: true,
        delete: true
      },
      {
        code: 'ROLES',
        name: 'Role Management',
        route: '/roles',
        icon: 'bi-shield-check',
        read: true,
        write: true,
        update: true,
        delete: true
      },
      {
        code: 'ACCESS',
        name: 'Access Control & Permissions',
        route: '/access',
        icon: 'bi-key-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      }
    ]
  },
  {
    title: 'ADMINISTRATION & SETTINGS',
    icon: 'bi-gear-fill',
    rows: [
      {
        code: 'DASHBOARD',
        name: 'Dashboard & Analytics',
        route: '/dashboard',
        icon: 'bi-grid-1x2-fill',
        read: true,
        write: true,
        update: true,
        delete: true
      },
      {
        code: 'STORE_SETTINGS',
        name: 'Store & Hospital Settings',
        route: '/settings',
        icon: 'bi-shop-window',
        read: true,
        write: true,
        update: true,
        delete: true
      },
      {
        code: 'TAX_SETTINGS',
        name: 'Tax & GST Configuration',
        route: '/tax',
        icon: 'bi-percent',
        read: true,
        write: true,
        update: true,
        delete: true
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class AccessService {

  private apiUrl = 'http://localhost:8082/api/access';
  private permissionsSubject = new BehaviorSubject<{ [code: string]: { read: boolean; write: boolean; update: boolean; delete: boolean } }>(this.loadCachedPermissions());
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.syncRolePermissions();
  }

  private loadCachedPermissions(): { [code: string]: { read: boolean; write: boolean; update: boolean; delete: boolean } } {
    try {
      const cached = localStorage.getItem('activeModulePermissions');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    const allPerms: { [code: string]: { read: boolean; write: boolean; update: boolean; delete: boolean } } = {};
    COMPLETED_MODULE_SECTIONS.forEach(s => s.rows.forEach(r => {
      allPerms[r.code] = { read: true, write: true, update: true, delete: true };
    }));
    return allPerms;
  }

  getAll(companyId?: number | string, activeOnly: boolean = false): Observable<AccessPermission[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<AccessPermission[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      catchError((err) => {
        console.error('Error loading access permissions from backend MySQL:', err);
        return of([] as AccessPermission[]);
      })
    );
  }

  getById(id: number): Observable<AccessPermission> {
    return this.http.get<AccessPermission>(`${this.apiUrl}/${id}`);
  }

  create(accessPermission: AccessPermission, companyId?: number | string): Observable<AccessPermission> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<AccessPermission>(`${this.apiUrl}?companyId=${cid}`, accessPermission);
  }

  update(id: number, accessPermission: AccessPermission): Observable<AccessPermission> {
    return this.http.put<AccessPermission>(`${this.apiUrl}/${id}`, accessPermission);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Clone default matrix for new form
  getDefaultSections(): ModuleSection[] {
    return JSON.parse(JSON.stringify(COMPLETED_MODULE_SECTIONS));
  }

  // Check if current user has general access to a specific module code (any action granted)
  canAccess(moduleCode: string): boolean {
    const cached = localStorage.getItem('activeModulePermissions');
    if (cached) {
      try {
        const perms = JSON.parse(cached);
        if (perms && perms[moduleCode] !== undefined) {
          const p = perms[moduleCode];
          return !!p.read || !!p.write || !!p.update || !!p.delete;
        }
      } catch {
        // ignore
      }
    }

    const role = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').trim().toUpperCase();
    if (role.includes('SUPER_ADMIN') || role.includes('SUPERADMIN')) {
      return true;
    }
    return true;
  }

  // Check granular permission ('read' | 'write' | 'update' | 'delete')
  hasPermission(moduleCode: string, action: 'read' | 'write' | 'update' | 'delete'): boolean {
    const cached = localStorage.getItem('activeModulePermissions');
    if (cached) {
      try {
        const perms = JSON.parse(cached);
        if (perms && perms[moduleCode] !== undefined) {
          return !!perms[moduleCode][action];
        }
      } catch (e) {
        console.warn('Error parsing activeModulePermissions:', e);
      }
    }

    const role = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').trim().toUpperCase();
    if (role.includes('SUPER_ADMIN') || role.includes('SUPERADMIN')) {
      return true;
    }

    // Default fallback: Everything is enabled by default unless explicitly restricted in Access Set
    return true;
  }

  canRead(moduleCode: string): boolean {
    return this.hasPermission(moduleCode, 'read');
  }

  canWrite(moduleCode: string): boolean {
    return this.hasPermission(moduleCode, 'write');
  }

  canUpdate(moduleCode: string): boolean {
    return this.hasPermission(moduleCode, 'update');
  }

  canDelete(moduleCode: string): boolean {
    return this.hasPermission(moduleCode, 'delete');
  }

  // Check if route is accessible
  canAccessRoute(routePath: string): boolean {
    const cleanRoute = routePath.startsWith('/') ? routePath : '/' + routePath;
    for (const sec of COMPLETED_MODULE_SECTIONS) {
      for (const row of sec.rows) {
        if (row.route === cleanRoute || (cleanRoute !== '/' && cleanRoute.startsWith(row.route))) {
          return this.canAccess(row.code);
        }
      }
    }
    return true;
  }

  // Store permissions map for active role/user and notify subscribers
  setActivePermissions(perms: { [code: string]: { read: boolean; write: boolean; update: boolean; delete: boolean } }): void {
    localStorage.setItem('activeModulePermissions', JSON.stringify(perms));
    this.permissionsSubject.next(perms);
  }

  // Synchronize permissions for the active user's role from MySQL database
  syncRolePermissions(roleName?: string, companyId?: string | number): void {
    const roleToSync = (roleName || localStorage.getItem('userRole') || localStorage.getItem('role') || '').trim();
    if (!roleToSync) return;

    const cid = companyId || localStorage.getItem('companyId') || '1';
    this.http.get<any[]>(`http://localhost:8082/api/roles?companyId=${cid}`).pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (roles) => {
        let matchedRole: any = null;
        if (roles && roles.length > 0) {
          matchedRole = roles.find(r => (r.roleName || '').trim().toLowerCase() === roleToSync.toLowerCase());
        }

        const accessSetName = (matchedRole?.accessLevel || '').trim();

        if (accessSetName) {
          this.getAll(cid).subscribe({
            next: (accessList) => {
              const matchedAccess = accessList.find(a => (a.name || '').trim().toLowerCase() === accessSetName.toLowerCase());
              if (matchedAccess && matchedAccess.modulePermissions) {
                try {
                  if (matchedAccess.modulePermissions.startsWith('{')) {
                    const data = JSON.parse(matchedAccess.modulePermissions);
                    const flatPerms: { [code: string]: { read: boolean; write: boolean; update: boolean; delete: boolean } } = {};
                    COMPLETED_MODULE_SECTIONS.forEach(sec => {
                      sec.rows.forEach(row => {
                        let p = data[row.code];
                        if (!p && data[sec.title] && data[sec.title][row.code]) {
                          p = data[sec.title][row.code];
                        }
                        if (p) {
                          flatPerms[row.code] = {
                            read: p.read !== undefined ? !!p.read : true,
                            write: p.write !== undefined ? !!p.write : true,
                            update: p.update !== undefined ? !!p.update : true,
                            delete: p.delete !== undefined ? !!p.delete : true
                          };
                        } else {
                          flatPerms[row.code] = {
                            read: true,
                            write: true,
                            update: true,
                            delete: true
                          };
                        }
                      });
                    });
                    this.setActivePermissions(flatPerms);
                    return;
                  }
                } catch (e) {
                  console.warn('Could not parse permissions JSON:', e);
                }
              }
            }
          });
        } else {
          // If no specific access set assigned to this role, grant full permissions across all modules
          const allPerms: { [code: string]: { read: boolean; write: boolean; update: boolean; delete: boolean } } = {};
          COMPLETED_MODULE_SECTIONS.forEach(s => s.rows.forEach(r => {
            allPerms[r.code] = { read: true, write: true, update: true, delete: true };
          }));
          this.setActivePermissions(allPerms);
        }
      }
    });
  }
}
