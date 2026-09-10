import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  AccessService,
  AccessPermission,
  ModuleSection,
  ModulePermissionRow
} from '../../../services/access.service';

@Component({
  selector: 'app-access-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './access-settings.html',
  styleUrl: './access-settings.css'
})
export class AccessSettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  // View state: 'GRID' for table listing, 'FORM' for Add/Edit matching user screenshot
  currentView: 'GRID' | 'FORM' = 'GRID';

  // Sidebar Layout Navigation State
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = true; // Auto-expanded to show Access page active
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  loggedInUser = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Deepak Raj';
  userRole = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'PHARMACIST').toUpperCase();
  activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';

  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // Access Profiles List State (from MySQL access_permissions table)
  accessList: AccessPermission[] = [];
  filteredList: AccessPermission[] = [];
  loading = false;
  searchQuery = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  // Form State (matching screenshot)
  isEditing = false;
  currentId: number | null = null;
  formName = '';
  formDescription = '';
  formStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  saving = false;

  // Real completed application module sections
  permissionSections: ModuleSection[] = [];

  // Delete Confirmation State
  showDeleteModal = false;
  deletingItem: AccessPermission | null = null;
  deleting = false;

  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';

  // Permission flags
  canReadAccess = true;
  canWriteAccess = true;
  canUpdateAccess = true;
  canDeleteAccess = true;

  constructor(
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initPermissionMatrix();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);

    this.canReadAccess = this.accessService.canRead('ACCESS');
    this.canWriteAccess = this.accessService.canWrite('ACCESS');
    this.canUpdateAccess = this.accessService.canUpdate('ACCESS');
    this.canDeleteAccess = this.accessService.canDelete('ACCESS');

    this.accessService.permissions$.subscribe(() => {
      this.canReadAccess = this.accessService.canRead('ACCESS');
      this.canWriteAccess = this.accessService.canWrite('ACCESS');
      this.canUpdateAccess = this.accessService.canUpdate('ACCESS');
      this.canDeleteAccess = this.accessService.canDelete('ACCESS');
      this.cdr.detectChanges();
    });

    this.loadAccessList();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Initialize permission sections with completed project modules
  initPermissionMatrix(): void {
    this.permissionSections = this.accessService.getDefaultSections();
  }

  loadAccessList(): void {
    this.loading = true;
    this.accessService.getAll(this.activeStoreId).subscribe({
      next: (data) => {
        this.accessList = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load access permissions from MySQL:', err);
        this.showToast('Could not load access permissions from database.', 'danger');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.accessList];

    if (this.filterStatus !== 'ALL') {
      result = result.filter(item => item.status === this.filterStatus);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.posPermissions && item.posPermissions.toLowerCase().includes(q)) ||
        (item.modulePermissions && item.modulePermissions.toLowerCase().includes(q))
      );
    }

    this.filteredList = result;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  setFilterStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  // Switch to Form view matching screenshot
  openAddForm(): void {
    this.isEditing = false;
    this.currentId = null;
    this.formName = '';
    this.formDescription = '';
    this.formStatus = 'ACTIVE';
    this.initPermissionMatrix();
    this.currentView = 'FORM';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openEditForm(item: AccessPermission): void {
    this.isEditing = true;
    this.currentId = item.id ?? null;
    this.formName = item.name;
    this.formDescription = item.description || '';
    this.formStatus = item.status || 'ACTIVE';

    this.initPermissionMatrix();
    this.parseStoredPermissions(item);

    this.currentView = 'FORM';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToGrid(): void {
    this.currentView = 'GRID';
    this.loadAccessList();
  }

  // Checkbox matrix section logic
  isSectionAllChecked(section: ModuleSection): boolean {
    return section.rows.every(r => r.read && r.write && r.update && r.delete);
  }

  toggleSectionAll(section: ModuleSection): void {
    const targetState = !this.isSectionAllChecked(section);
    section.rows.forEach(r => {
      r.read = targetState;
      r.write = targetState;
      r.update = targetState;
      r.delete = targetState;
    });
  }

  // Row master toggle
  isRowAllChecked(row: ModulePermissionRow): boolean {
    return row.read && row.write && row.update && row.delete;
  }

  toggleRowAll(row: ModulePermissionRow): void {
    const nextState = !this.isRowAllChecked(row);
    row.read = nextState;
    row.write = nextState;
    row.update = nextState;
    row.delete = nextState;
  }

  isColumnAllChecked(col: 'read' | 'write' | 'update' | 'delete'): boolean {
    if (!this.permissionSections || this.permissionSections.length === 0) return false;
    return this.permissionSections.every(sec => sec.rows.every(r => r[col]));
  }

  // Quick Presets
  applyPreset(preset: 'ALL' | 'CLEAR' | 'READ_ALL' | 'WRITE_ALL' | 'UPDATE_ALL' | 'DELETE_ALL'): void {
    switch (preset) {
      case 'ALL':
        this.permissionSections.forEach(sec => sec.rows.forEach(r => {
          r.read = true;
          r.write = true;
          r.update = true;
          r.delete = true;
        }));
        break;
      case 'CLEAR':
        this.permissionSections.forEach(sec => sec.rows.forEach(r => {
          r.read = false;
          r.write = false;
          r.update = false;
          r.delete = false;
        }));
        break;
      case 'READ_ALL': {
        const target = !this.isColumnAllChecked('read');
        this.permissionSections.forEach(sec => sec.rows.forEach(r => r.read = target));
        break;
      }
      case 'WRITE_ALL': {
        const target = !this.isColumnAllChecked('write');
        this.permissionSections.forEach(sec => sec.rows.forEach(r => r.write = target));
        break;
      }
      case 'UPDATE_ALL': {
        const target = !this.isColumnAllChecked('update');
        this.permissionSections.forEach(sec => sec.rows.forEach(r => r.update = target));
        break;
      }
      case 'DELETE_ALL': {
        const target = !this.isColumnAllChecked('delete');
        this.permissionSections.forEach(sec => sec.rows.forEach(r => r.delete = target));
        break;
      }
    }
    this.cdr.detectChanges();
  }

  // Parse permissions from MySQL record
  private parseStoredPermissions(item: AccessPermission): void {
    if (!item.modulePermissions) return;

    try {
      if (item.modulePermissions.startsWith('{')) {
        const data = JSON.parse(item.modulePermissions);
        this.permissionSections.forEach(section => {
          section.rows.forEach(row => {
            // Check flat code
            let saved = data[row.code];
            // Check nested section title
            if (!saved && data[section.title] && data[section.title][row.code]) {
              saved = data[section.title][row.code];
            }
            if (saved) {
              row.read = !!saved.read;
              row.write = !!saved.write;
              row.update = !!saved.update;
              row.delete = !!saved.delete;
            }
          });
        });
        return;
      }
    } catch (e) {
      console.warn('Could not parse JSON modulePermissions:', e);
    }

    // Fallback: if comma-separated codes exist
    if (item.modulePermissions) {
      const codes = item.modulePermissions.split(',').map(s => s.trim().toUpperCase());
      this.permissionSections.forEach(sec => {
        sec.rows.forEach(r => {
          if (codes.includes(r.code)) {
            r.read = true;
            r.write = true;
          }
        });
      });
    }
  }

  // Save Access Set to DB
  saveAccessSet(): void {
    if (this.isEditing && !this.canUpdateAccess) {
      this.showToast('Permission Denied: Update permission required to modify access permissions.', 'danger');
      return;
    }

    if (!this.isEditing && !this.canWriteAccess) {
      this.showToast('Permission Denied: Write permission required to create access permissions.', 'danger');
      return;
    }

    if (!this.formName || !this.formName.trim()) {
      this.showToast('Please enter Access Set Name', 'danger');
      return;
    }

    this.saving = true;

    // Build structured JSON matrix of all modules
    const matrixPayload: { [code: string]: { name: string; route: string; read: boolean; write: boolean; update: boolean; delete: boolean } } = {};
    const enabledModuleCodes: string[] = [];

    this.permissionSections.forEach(section => {
      section.rows.forEach(row => {
        matrixPayload[row.code] = {
          name: row.name,
          route: row.route,
          read: row.read,
          write: row.write,
          update: row.update,
          delete: row.delete
        };
        if (row.read || row.write || row.update || row.delete) {
          enabledModuleCodes.push(row.code);
        }
      });
    });

    const payload: AccessPermission = {
      name: this.formName.trim(),
      description: this.formDescription.trim(),
      posPermissions: enabledModuleCodes.join(','),
      modulePermissions: JSON.stringify(matrixPayload),
      status: this.formStatus
    };

    if (this.isEditing && this.currentId) {
      this.accessService.update(this.currentId, payload).subscribe({
        next: (updated) => {
          this.showToast(`Access Set "${updated.name}" updated successfully in database!`, 'success');
          this.saving = false;
          this.accessService.syncRolePermissions(undefined, this.activeStoreId);
          this.backToGrid();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.showToast('Failed to update Access Set in MySQL.', 'danger');
          this.saving = false;
        }
      });
    } else {
      this.accessService.create(payload, this.activeStoreId).subscribe({
        next: (created) => {
          this.showToast(`Access Set "${created.name}" created successfully in database!`, 'success');
          this.saving = false;
          this.accessService.syncRolePermissions(undefined, this.activeStoreId);
          this.backToGrid();
        },
        error: (err) => {
          console.error('Create error:', err);
          this.showToast('Failed to create Access Set in MySQL.', 'danger');
          this.saving = false;
        }
      });
    }
  }

  // Helpers for Grid display
  getEnabledCount(item: AccessPermission): number {
    if (!item.modulePermissions) return 0;
    try {
      if (item.modulePermissions.startsWith('{')) {
        const data = JSON.parse(item.modulePermissions);
        let count = 0;
        Object.keys(data).forEach(k => {
          if (data[k] && (data[k].read || data[k].write || data[k].update || data[k].delete)) {
            count++;
          }
        });
        return count;
      }
    } catch {}
    if (item.posPermissions) {
      return item.posPermissions.split(',').filter(x => x.trim()).length;
    }
    return 0;
  }

  getActiveModuleNames(item: AccessPermission): string[] {
    if (!item.modulePermissions) return [];
    try {
      if (item.modulePermissions.startsWith('{')) {
        const data = JSON.parse(item.modulePermissions);
        const list: string[] = [];
        Object.keys(data).forEach(k => {
          if (data[k] && data[k].read) {
            list.push(data[k].name || k);
          }
        });
        return list.slice(0, 4);
      }
    } catch {}
    if (item.posPermissions) {
      return item.posPermissions.split(',').slice(0, 4);
    }
    return [];
  }

  // Delete Actions
  confirmDelete(item: AccessPermission): void {
    if (!this.canDeleteAccess) {
      this.showToast('Permission Denied: Delete permission required.', 'danger');
      return;
    }
    this.deletingItem = item;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingItem = null;
    this.deleting = false;
  }

  executeDelete(): void {
    if (!this.deletingItem || !this.deletingItem.id) return;

    this.deleting = true;
    const id = this.deletingItem.id;
    const name = this.deletingItem.name;

    this.accessService.delete(id).subscribe({
      next: () => {
        this.showToast(`Access Set "${name}" deleted.`, 'info');
        this.closeDeleteModal();
        this.loadAccessList();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.showToast('Failed to delete Access Set.', 'danger');
        this.deleting = false;
      }
    });
  }

  // Quick Status Toggle
  toggleStatus(item: AccessPermission): void {
    if (!item.id) return;
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.accessService.update(item.id, { ...item, status: newStatus }).subscribe({
      next: () => {
        item.status = newStatus;
        this.applyFilter();
        this.showToast(`Access profile "${item.name}" is now ${newStatus}.`, 'success');
      },
      error: (err) => {
        console.error('Toggle status error:', err);
        this.showToast('Failed to update status.', 'danger');
      }
    });
  }

  showToast(message: string, type: 'success' | 'danger' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  goBack(): void {
    if (this.currentView === 'FORM') {
      this.backToGrid();
    } else {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.router.navigate(['/users']);
      }
    }
  }

  // Sidebar Layout Toggles
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isUserMenuOpen = true;
    }
  }

  
  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

  togglePatientMenu(): void {
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
  }

  toggleDoctorMenu(): void {
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  openPatientFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
    this.cdr.detectChanges();
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
  }

  openUserFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  canAccess(moduleCode: string): boolean {
    return this.accessService.canAccess(moduleCode);
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.btn-sidebar-toggle') || document.querySelector('.toggle-btn');
    const target = event.target as Node;
    
    if (sidebar && !sidebar.contains(target) && (!toggleBtn || !toggleBtn.contains(target))) {
      this.closeAllMenus();
    }
  }

  closeAllMenus() {
    const self = this as any;
    if (typeof self.isPatientMenuOpen !== 'undefined') self.isPatientMenuOpen = false;
    if (typeof self.isDoctorMenuOpen !== 'undefined') self.isDoctorMenuOpen = false;
    if (typeof self.isUserMenuOpen !== 'undefined') self.isUserMenuOpen = false;
    if (typeof self.isSettingsMenuOpen !== 'undefined') self.isSettingsMenuOpen = false;
    if (typeof self.isSalesMenuOpen !== 'undefined') self.isSalesMenuOpen = false;
    if (typeof self.isPurchaseMenuOpen !== 'undefined') self.isPurchaseMenuOpen = false;
    if (typeof self.isSupplierMenuOpen !== "undefined") self.isSupplierMenuOpen = false;
  }

}
