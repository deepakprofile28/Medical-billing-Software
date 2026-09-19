import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, of, tap, timeout } from 'rxjs';
import { RoleService } from './role.service';

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
      { code: 'POS_BILLING', name: 'POS Billing Counter', route: '/pos', icon: 'bi-cart-check-fill', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'SALES MANAGEMENT',
    icon: 'bi-graph-up-arrow',
    rows: [
      { code: 'SALES_TRANSACTION', name: 'Sales Transaction', route: '/sales-transactions', icon: 'bi-cash-coin', read: true, write: true, update: true, delete: true },
      { code: 'SALES_ORDER', name: 'Sales Order', route: '/sales-orders', icon: 'bi-journal-text', read: true, write: true, update: true, delete: true },
      { code: 'SALES_SUSPENDED', name: 'Sales Suspended', route: '/sales-suspended', icon: 'bi-pause-circle', read: true, write: true, update: true, delete: true },
      { code: 'SALES_COMPLETED', name: 'Sales Completed', route: '/sales-completed', icon: 'bi-check2-circle', read: true, write: true, update: true, delete: true },
      { code: 'SALES_EXCHANGE', name: 'Sales Exchange', route: '/sales-exchange', icon: 'bi-arrow-left-right', read: true, write: true, update: true, delete: true },
      { code: 'SALES_RETURN', name: 'Sales Return', route: '/sales-returns', icon: 'bi-arrow-return-left', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'PURCHASE MANAGEMENT',
    icon: 'bi-cart-plus-fill',
    rows: [
      { code: 'PURCHASE', name: 'Purchase List', route: '/purchase', icon: 'bi-bag-plus-fill', read: true, write: true, update: true, delete: true },
      { code: 'PURCHASE_RETURN', name: 'Purchase Return', route: '/purchase-returns', icon: 'bi-bag-dash-fill', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'SUPPLIER MANAGEMENT',
    icon: 'bi-truck',
    rows: [
      { code: 'SUPPLIER_LIST', name: 'Supplier List', route: '/supplier-list', icon: 'bi-card-list', read: true, write: true, update: true, delete: true },
      { code: 'SUPPLIER_REGISTRATION', name: 'Add Supplier', route: '/supplier-registration', icon: 'bi-person-plus-fill', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'MEDICINES & INVENTORY',
    icon: 'bi-capsule-pill',
    rows: [
      { code: 'TABLETS', name: 'Products Inventory', route: '/tablets', icon: 'bi-capsule', read: true, write: true, update: true, delete: true },
      { code: 'CATEGORIES', name: 'Medicine Categories', route: '/category-settings', icon: 'bi-tags-fill', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'PATIENT MANAGEMENT',
    icon: 'bi-person-vcard-fill',
    rows: [
      { code: 'PATIENT_REGISTRATION', name: 'Patient Registration', route: '/patient-registration', icon: 'bi-person-plus-fill', read: true, write: true, update: true, delete: true },
      { code: 'PATIENT_LIST', name: 'Patient Directory', route: '/patient-list', icon: 'bi-people-fill', read: true, write: true, update: true, delete: true },
      { code: 'PATIENT_DETAILS', name: 'Patient Clinical Details', route: '/patient-details', icon: 'bi-file-medical-fill', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'DOCTOR MANAGEMENT',
    icon: 'bi-person-badge-fill',
    rows: [
      { code: 'DOCTORS', name: 'Doctor Management', route: '/doctors', icon: 'bi-person-badge', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'CLINICAL & AI INTELLIGENCE',
    icon: 'bi-robot',
    rows: [
      { code: 'AI_ASSISTANT', name: 'AI Medical Assistant', route: '/ai-assistant', icon: 'bi-cpu-fill', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'STAFF & SECURITY',
    icon: 'bi-shield-lock-fill',
    rows: [
      { code: 'USER_MANAGEMENT', name: 'User Management', route: '/users', icon: 'bi-person-gear', read: true, write: true, update: true, delete: true },
      { code: 'ROLES', name: 'Role Management', route: '/roles', icon: 'bi-shield-check', read: true, write: true, update: true, delete: true },
      { code: 'ACCESS', name: 'Access Control', route: '/access', icon: 'bi-key-fill', read: true, write: true, update: true, delete: true }
    ]
  },
  {
    title: 'ADMINISTRATION & SETTINGS',
    icon: 'bi-gear-fill',
    rows: [
      { code: 'DASHBOARD', name: 'Dashboard', route: '/dashboard', icon: 'bi-grid-1x2-fill', read: true, write: true, update: true, delete: true },
      { code: 'STORE_SETTINGS', name: 'Store Settings', route: '/settings', icon: 'bi-shop-window', read: true, write: true, update: true, delete: true },
      { code: 'TAX_SETTINGS', name: 'Tax Config', route: '/tax', icon: 'bi-percent', read: true, write: true, update: true, delete: true },
      { code: 'WAREHOUSE_SETTINGS', name: 'Warehouse', route: '/warehouse', icon: 'bi-building-gear', read: true, write: true, update: true, delete: true },
      { code: 'BRAND_SETTINGS', name: 'Brand Config', route: '/brand', icon: 'bi-box-fill', read: true, write: true, update: true, delete: true },
      { code: 'RACK_SETTINGS', name: 'Rack Config', route: '/rack', icon: 'bi-box-seam', read: true, write: true, update: true, delete: true }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class AccessService {

  private apiUrl = 'http://localhost:8082/api/access';
  private storageKey = 'pharma_access_sets_data';
  private deletedKey = 'pharma_deleted_access_ids';
  private permissionsSubject = new BehaviorSubject<{ [code: string]: { read: boolean; write: boolean; update: boolean; delete: boolean } }>(this.loadCachedPermissions());
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private roleService: RoleService
  ) {
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

  private getInitialMockAccessSets(): AccessPermission[] {
    const fullMatrix: { [code: string]: { name: string; route: string; read: boolean; write: boolean; update: boolean; delete: boolean } } = {};
    const allCodes: string[] = [];

    COMPLETED_MODULE_SECTIONS.forEach(sec => {
      sec.rows.forEach(r => {
        allCodes.push(r.code);
        fullMatrix[r.code] = {
          name: r.name,
          route: r.route,
          read: true,
          write: true,
          update: true,
          delete: true
        };
      });
    });

    // Pharmacist Matrix
    const pharmacistCodes = [
      'POS_BILLING', 'SALES_TRANSACTION', 'SALES_SUSPENDED', 'SALES_COMPLETED',
      'SALES_EXCHANGE', 'SALES_RETURN', 'TABLETS', 'CATEGORIES',
      'PATIENT_REGISTRATION', 'PATIENT_LIST', 'PATIENT_DETAILS'
    ];
    const pharmacistMatrix: { [code: string]: { name: string; route: string; read: boolean; write: boolean; update: boolean; delete: boolean } } = {};
    COMPLETED_MODULE_SECTIONS.forEach(sec => {
      sec.rows.forEach(r => {
        const allowed = pharmacistCodes.includes(r.code);
        pharmacistMatrix[r.code] = {
          name: r.name,
          route: r.route,
          read: allowed,
          write: allowed,
          update: allowed,
          delete: allowed && r.code !== 'TABLETS' && r.code !== 'CATEGORIES'
        };
      });
    });

    // Inventory Manager Matrix
    const inventoryCodes = [
      'PURCHASE', 'PURCHASE_RETURN', 'SUPPLIER_LIST', 'SUPPLIER_REGISTRATION',
      'TABLETS', 'CATEGORIES', 'STORE_SETTINGS', 'WAREHOUSE_SETTINGS',
      'BRAND_SETTINGS', 'RACK_SETTINGS'
    ];
    const inventoryMatrix: { [code: string]: { name: string; route: string; read: boolean; write: boolean; update: boolean; delete: boolean } } = {};
    COMPLETED_MODULE_SECTIONS.forEach(sec => {
      sec.rows.forEach(r => {
        const allowed = inventoryCodes.includes(r.code);
        inventoryMatrix[r.code] = {
          name: r.name,
          route: r.route,
          read: allowed,
          write: allowed,
          update: allowed,
          delete: allowed
        };
      });
    });

    return [
      {
        id: 1,
        name: 'Administrator Full Access',
        description: 'Unrestricted master access across all clinical, POS billing, inventory, and system modules',
        posPermissions: allCodes.join(','),
        modulePermissions: JSON.stringify(fullMatrix),
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-01-01T10:00:00.000Z'
      },
      {
        id: 2,
        name: 'Pharmacist & Counter Staff',
        description: 'Dispensary access for POS billing, customer sales transactions, tablet search, and patient directory',
        posPermissions: pharmacistCodes.join(','),
        modulePermissions: JSON.stringify(pharmacistMatrix),
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-01-15T10:00:00.000Z'
      },
      {
        id: 3,
        name: 'Inventory & Store Manager',
        description: 'Supply chain management for purchase orders, supplier registrations, medicines, and warehouse racks',
        posPermissions: inventoryCodes.join(','),
        modulePermissions: JSON.stringify(inventoryMatrix),
        status: 'ACTIVE',
        companyId: 1,
        createdAt: '2026-02-01T10:00:00.000Z'
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
        console.warn('Could not save deleted access id:', e);
      }
    }
  }

  getLocalAccessSets(): AccessPermission[] {
    const deletedIds = this.getDeletedIds();
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(a => !deletedIds.includes(Number(a.id)));
        }
      }
    } catch (e) {
      console.error('Error reading access sets from localStorage:', e);
    }
    const initial = this.getInitialMockAccessSets().filter(a => !deletedIds.includes(Number(a.id)));
    this.saveLocalAccessSets(initial);
    return initial;
  }

  saveLocalAccessSets(sets: AccessPermission[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(sets));
    } catch (e) {
      console.warn('LocalStorage save attempt failed for access sets:', e);
    }
  }

  getAll(companyId?: number | string, activeOnly: boolean = false): Observable<AccessPermission[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    const deletedIds = this.getDeletedIds();
    return this.http.get<AccessPermission[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      timeout(1000),
      tap((data) => {
        if (data && data.length > 0) {
          const sanitized = data.filter(a => !deletedIds.includes(Number(a.id)));
          this.saveLocalAccessSets(sanitized);
        }
      }),
      catchError(() => {
        const local = this.getLocalAccessSets().filter(item => {
          const matchCompany = !item.companyId || String(item.companyId) === String(cid);
          const matchActive = !activeOnly || item.status === 'ACTIVE';
          return matchCompany && matchActive;
        });
        return of(local);
      })
    );
  }

  getById(id: number): Observable<AccessPermission> {
    return this.http.get<AccessPermission>(`${this.apiUrl}/${id}`).pipe(
      timeout(1000),
      catchError(() => {
        const list = this.getLocalAccessSets();
        const found = list.find(a => Number(a.id) === Number(id));
        if (found) {
          return of(found);
        }
        return of({
          id,
          name: 'Access Set',
          status: 'ACTIVE'
        } as AccessPermission);
      })
    );
  }

  create(accessPermission: AccessPermission, companyId?: number | string): Observable<AccessPermission> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    accessPermission.companyId = Number(cid) || 1;
    if (!accessPermission.id) {
      accessPermission.id = Date.now();
    }
    if (!accessPermission.createdAt) {
      accessPermission.createdAt = new Date().toISOString();
    }

    // Remove from deleted list if ID was previously tracked as deleted
    const deleted = this.getDeletedIds().filter(d => d !== Number(accessPermission.id));
    try {
      localStorage.setItem(this.deletedKey, JSON.stringify(deleted));
    } catch {}

    // Immediately save locally so UI and reload are 100% resilient
    const currentList = this.getLocalAccessSets();
    const exists = currentList.find(a => Number(a.id) === Number(accessPermission.id));
    if (!exists) {
      currentList.unshift(accessPermission);
    }
    this.saveLocalAccessSets(currentList);

    return this.http.post<AccessPermission>(`${this.apiUrl}?companyId=${cid}`, accessPermission).pipe(
      timeout(1000),
      tap((saved) => {
        if (saved && saved.id) {
          const list = this.getLocalAccessSets();
          const idx = list.findIndex(a => Number(a.id) === Number(accessPermission.id));
          if (idx !== -1) {
            list[idx] = saved;
          } else {
            list.unshift(saved);
          }
          this.saveLocalAccessSets(list);
        }
      }),
      catchError(() => {
        return of(accessPermission);
      })
    );
  }

  update(id: number, accessPermission: AccessPermission): Observable<AccessPermission> {
    accessPermission.id = id;
    accessPermission.updatedAt = new Date().toISOString();

    // Immediately update locally
    const currentList = this.getLocalAccessSets();
    const idx = currentList.findIndex(a => Number(a.id) === Number(id));
    if (idx !== -1) {
      currentList[idx] = { ...currentList[idx], ...accessPermission };
      this.saveLocalAccessSets(currentList);
    }

    return this.http.put<AccessPermission>(`${this.apiUrl}/${id}`, accessPermission).pipe(
      timeout(1000),
      tap((updated) => {
        if (updated) {
          const list = this.getLocalAccessSets();
          const i = list.findIndex(a => Number(a.id) === Number(id));
          if (i !== -1) {
            list[i] = { ...list[i], ...updated };
            this.saveLocalAccessSets(list);
          }
        }
      }),
      catchError(() => {
        return of(accessPermission);
      })
    );
  }

  delete(id: number | string): Observable<void> {
    const numId = Number(id);
    const strId = String(id);

    // 1. Immediately record in persistent deleted IDs so it NEVER comes back
    this.markAsDeleted(numId);

    // 2. Immediately remove from local access sets in localStorage
    const current = this.getLocalAccessSets();
    const filtered = current.filter(a => Number(a.id) !== numId && String(a.id) !== strId);
    this.saveLocalAccessSets(filtered);

    // 3. Dispatch HTTP delete (backend offline/online handled gracefully)
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      timeout(1000),
      catchError(() => of(void 0))
    );
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

  // Synchronize permissions for the active user's role
  syncRolePermissions(roleName?: string, companyId?: string | number): void {
    const roleToSync = (roleName || localStorage.getItem('userRole') || localStorage.getItem('role') || '').trim();
    if (!roleToSync) return;

    const cid = companyId || localStorage.getItem('companyId') || '1';
    this.roleService.getAllRoles(cid).subscribe({
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
