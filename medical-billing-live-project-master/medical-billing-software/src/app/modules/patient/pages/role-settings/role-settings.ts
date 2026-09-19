import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RoleService, Role } from '../../../services/role.service';
import { AccessService, AccessPermission } from '../../../services/access.service';

@Component({
  selector: 'app-role-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './role-settings.html',
  styleUrl: './role-settings.css'
})
export class RoleSettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  // Layout & Sidebar Navigation State matching Dashboard (Sidebar closed by default, active submenu open)
  isSidebarCollapsed = true;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false; // Auto-expanded to show Role page active under User Management
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

  // Roles State (Direct from MySQL table roles)
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  loading = false;
  searchQuery = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  // Access Sets loaded dynamically from MySQL table access_permissions
  accessSets: AccessPermission[] = [];

  // Add / Edit Modal State
  showModal = false;
  isEditing = false;
  saving = false;
  currentRoleId: number | null = null;

  roleForm: Role = {
    roleName: '',
    designation: '',
    accessLevel: '',
    description: '',
    status: 'ACTIVE'
  };

  // Delete Confirmation State
  showDeleteModal = false;
  deletingRole: Role | null = null;
  deleting = false;

  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';

  // Common quick access chips
  accessPresets: string[] = [
    'Full System Access',
    'POS Billing Counter',
    'Tablets & Inventory',
    'Patient Management',
    'User Management',
    'Settings & Tax',
    'View Only'
  ];

  // Permission flags
  canReadRole = true;
  canWriteRole = true;
  canUpdateRole = true;
  canDeleteRole = true;

  constructor(
    private roleService: RoleService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);

    this.canReadRole = this.accessService.canRead('ROLES');
    this.canWriteRole = this.accessService.canWrite('ROLES');
    this.canUpdateRole = this.accessService.canUpdate('ROLES');
    this.canDeleteRole = this.accessService.canDelete('ROLES');

    this.accessService.permissions$.subscribe(() => {
      this.canReadRole = this.accessService.canRead('ROLES');
      this.canWriteRole = this.accessService.canWrite('ROLES');
      this.canUpdateRole = this.accessService.canUpdate('ROLES');
      this.canDeleteRole = this.accessService.canDelete('ROLES');
      this.cdr.detectChanges();
    });

    this.loadRoles();
    this.loadAccessSets();
  }

  loadAccessSets(): void {
    this.accessService.getAll(this.activeStoreId, true).subscribe({
      next: (list) => {
        this.accessSets = list || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Could not load access sets from MySQL:', err);
      }
    });
  }

  canAccess(moduleCode: string): boolean {
    return this.accessService.canAccess(moduleCode);
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

  // Load from MySQL Backend
  loadRoles(): void {
    this.loading = true;
    this.roleService.getAllRoles(this.activeStoreId).subscribe({
      next: (data) => {
        this.roles = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load roles from MySQL:', err);
        this.showToast('Could not load roles from database.', 'danger');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.roles];

    if (this.filterStatus !== 'ALL') {
      result = result.filter(r => r.status === this.filterStatus);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(r =>
        (r.roleName && r.roleName.toLowerCase().includes(q)) ||
        (r.designation && r.designation.toLowerCase().includes(q)) ||
        (r.accessLevel && r.accessLevel.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    this.filteredRoles = result;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  setFilterStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  // Modal Actions
  openAddModal(): void {
    this.isEditing = false;
    this.currentRoleId = null;
    this.roleForm = {
      roleName: '',
      designation: '',
      accessLevel: '',
      description: '',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(role: Role): void {
    this.isEditing = true;
    this.currentRoleId = role.id ?? null;
    this.roleForm = {
      roleName: role.roleName,
      designation: role.designation || '',
      accessLevel: role.accessLevel || '',
      description: role.description || '',
      status: role.status || 'ACTIVE'
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  toggleAccessChip(preset: string): void {
    const current = this.roleForm.accessLevel ? this.roleForm.accessLevel.split(',').map(s => s.trim()).filter(Boolean) : [];
    const idx = current.indexOf(preset);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(preset);
    }
    this.roleForm.accessLevel = current.join(', ');
  }

  isAccessSelected(preset: string): boolean {
    if (!this.roleForm.accessLevel) return false;
    return this.roleForm.accessLevel.includes(preset);
  }

  saveRole(): void {
    if (this.isEditing && !this.canUpdateRole) {
      this.showToast('Permission Denied: Update permission required to modify roles.', 'danger');
      return;
    }

    if (!this.isEditing && !this.canWriteRole) {
      this.showToast('Permission Denied: Write permission required to add new roles.', 'danger');
      return;
    }

    if (!this.roleForm.roleName || !this.roleForm.roleName.trim()) {
      this.showToast('Please enter a Role Name', 'danger');
      return;
    }

    this.saving = true;

    if (this.isEditing && this.currentRoleId) {
      this.roleService.updateRole(this.currentRoleId, this.roleForm).subscribe({
        next: (updated) => {
          this.showToast(`Role "${updated.roleName}" updated successfully!`, 'success');
          this.accessService.syncRolePermissions(updated.roleName, this.activeStoreId);
          this.closeModal();
          this.loadRoles();
        },
        error: (err) => {
          console.error('Update role error:', err);
          this.showToast('Failed to update role in database.', 'danger');
          this.saving = false;
        }
      });
    } else {
      this.roleService.createRole(this.roleForm, this.activeStoreId).subscribe({
        next: (created) => {
          this.showToast(`New role "${created.roleName}" added successfully!`, 'success');
          this.accessService.syncRolePermissions(created.roleName, this.activeStoreId);
          this.closeModal();
          this.loadRoles();
        },
        error: (err) => {
          console.error('Create role error:', err);
          this.showToast('Failed to create role in database.', 'danger');
          this.saving = false;
        }
      });
    }
  }

  // Delete Actions
  confirmDelete(role: Role): void {
    if (!this.canDeleteRole) {
      this.showToast('Permission Denied: Delete permission required.', 'danger');
      return;
    }
    this.deletingRole = role;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingRole = null;
    this.deleting = false;
  }

  executeDelete(): void {
    if (!this.deletingRole || !this.deletingRole.id) return;

    this.deleting = true;
    const roleId = this.deletingRole.id;
    const roleName = this.deletingRole.roleName;

    this.roleService.deleteRole(roleId).subscribe({
      next: () => {
        this.showToast(`Role "${roleName}" has been deleted.`, 'info');
        this.closeDeleteModal();
        this.loadRoles();
      },
      error: (err) => {
        console.error('Delete role error:', err);
        this.showToast('Failed to delete role from database.', 'danger');
        this.deleting = false;
      }
    });
  }

  // Quick Status Toggle
  toggleStatus(role: Role): void {
    if (!role.id) return;
    const newStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.roleService.updateRole(role.id, { ...role, status: newStatus }).subscribe({
      next: () => {
        role.status = newStatus;
        this.applyFilter();
        this.showToast(`Role "${role.roleName}" is now ${newStatus}.`, 'success');
      },
      error: (err) => {
        console.error('Toggle status error:', err);
        this.showToast('Failed to update role status.', 'danger');
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
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/users']);
    }
  }

  // Sidebar Layout Toggles
  

  
  

  

  

  

  

  

  

  

  

  

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  

  


  

  


  // ==========================================
  // SIDEBAR & SUBMENU CONTROLS (EXPAND ON CLICK & OUTSIDE CLOSE)
  // ==========================================
  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  


  // ==========================================
  // SIDEBAR & SUBMENU CONTROLS (EXPAND ON CLICK & OUTSIDE CLOSE)
  // ==========================================
  toggleSidebar(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      this.closeAllMenus();
    }
    this.cdr.detectChanges();
  }

  togglePatientMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
    this.cdr.detectChanges();
  }

  toggleDoctorMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
    this.cdr.detectChanges();
  }

  toggleUserMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.cdr.detectChanges();
  }

  toggleSettingsMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
    this.cdr.detectChanges();
  }

  toggleSupplierMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
    this.cdr.detectChanges();
  }

  togglePurchaseMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isPurchaseMenuOpen = !this.isPurchaseMenuOpen;
    this.cdr.detectChanges();
  }

  toggleSalesMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSalesMenuOpen = !this.isSalesMenuOpen;
    this.cdr.detectChanges();
  }

  openPatientFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isPatientMenuOpen = true;
    this.cdr.detectChanges();
  }

  openDoctorFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
  }

  openUserFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSettingsFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSupplierFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isSupplierMenuOpen = true;
    this.cdr.detectChanges();
  }

  openPurchaseFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isPurchaseMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSalesFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isSalesMenuOpen = true;
    this.cdr.detectChanges();
  }

  closeAllMenus(): void {
    this.isPatientMenuOpen = false;
    this.isDoctorMenuOpen = false;
    this.isUserMenuOpen = false;
    this.isSettingsMenuOpen = false;
    this.isSalesMenuOpen = false;
    this.isPurchaseMenuOpen = false;
    this.isSupplierMenuOpen = false;
  }

  closeSidebarOnNavigate(): void {
    this.isSidebarCollapsed = true;
    this.closeAllMenus();
    this.cdr.detectChanges();
  }

  onNavClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a[routerLink], a.sub-menu-item');
    if (link) {
      this.closeSidebarOnNavigate();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isSidebarCollapsed) {
      return;
    }
    const targetEl = (event.target as HTMLElement)?.nodeType === 1 
      ? (event.target as HTMLElement) 
      : (event.target as HTMLElement)?.parentElement;
    
    // If target element was detached during re-render, do NOT close!
    if (!targetEl || !targetEl.isConnected) {
      return;
    }

    const clickedInsideSidebar = !!targetEl.closest?.('.app-sidebar, .sidebar');
    const clickedToggleBtn = !!targetEl.closest?.('.btn-sidebar-toggle, .sidebar-toggle-btn, .btn-toggle-sidebar, .btn-sidebar-toggle-mobile, .toggle-btn');

    if (!clickedInsideSidebar && !clickedToggleBtn) {
      this.closeAllMenus();
      this.isSidebarCollapsed = true;
      this.cdr.detectChanges();
    }
  }

}
