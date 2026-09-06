import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { WarehouseService, Warehouse } from '../../../services/warehouse.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-warehouse-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './warehouse-settings.html',
  styleUrl: './warehouse-settings.css'
})
export class WarehouseSettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;

  canUpdateWarehouse = true;
  canDeleteWarehouse = true;

  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = true;
  isSalesMenuOpen = false;

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = 'Apollo Pharmacy Hub';
  activeStoreId = '1';

  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  warehouses: Warehouse[] = [];
  filteredWarehouses: Warehouse[] = [];
  loading = false;
  searchQuery = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  showModal = false;
  isEditing = false;
  saving = false;
  currentWarehouseId: number | null = null;

  warehouseForm: Warehouse = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPerson: '',
    phone: '',
    email: '',
    capacity: 10000,
    status: 'ACTIVE'
  };

  toastMessage = '';

  constructor(
    private authService: AuthService,
    private warehouseService: WarehouseService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canUpdateWarehouse = this.accessService.canUpdate('SETTINGS');
    this.canDeleteWarehouse = this.accessService.canDelete('SETTINGS');
    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private initContext(): void {
    this.loggedInUser = this.authService.getUserName() || localStorage.getItem('companyName') || 'Apollo';
    this.userRole = (this.authService.getRole() || 'ADMIN').toUpperCase();
    this.activeStoreId = localStorage.getItem('companyId') || '1';
    this.activeStoreName = localStorage.getItem('companyName') || 'Apollo Pharmacy Hub';
  }

  private updateClock(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  toggleSidebar(): void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  togglePatientMenu(): void { this.isPatientMenuOpen = !this.isPatientMenuOpen; }
  toggleDoctorMenu(): void { this.isDoctorMenuOpen = !this.isDoctorMenuOpen; }
  toggleUserMenu(): void { this.isUserMenuOpen = !this.isUserMenuOpen; }
  toggleSettingsMenu(): void { this.isSettingsMenuOpen = !this.isSettingsMenuOpen; }

  openPatientFromCollapsed(): void { this.isSidebarCollapsed = false; this.isPatientMenuOpen = true; }
  openDoctorFromCollapsed(): void { this.isSidebarCollapsed = false; this.isDoctorMenuOpen = true; }
  openUserFromCollapsed(): void { this.isSidebarCollapsed = false; this.isUserMenuOpen = true; }
  openSettingsFromCollapsed(): void { this.isSidebarCollapsed = false; this.isSettingsMenuOpen = true; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  canAccess(moduleCode: string): boolean {
    return this.accessService.canAccess(moduleCode);
  }

  loadWarehouses(): void {
    this.loading = true;
    this.warehouseService.getAllWarehouses(this.activeStoreId).subscribe({
      next: (data) => {
        this.warehouses = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load warehouses:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.warehouses];
    if (this.filterStatus !== 'ALL') {
      result = result.filter(w => (w.status || 'ACTIVE').toUpperCase() === this.filterStatus);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(w =>
        w.name.toLowerCase().includes(q) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.city && w.city.toLowerCase().includes(q)) ||
        (w.contactPerson && w.contactPerson.toLowerCase().includes(q))
      );
    }
    this.filteredWarehouses = result;
  }

  onSearchChange(): void { this.applyFilter(); }
  setFilterStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentWarehouseId = null;
    this.warehouseForm = {
      name: '',
      code: 'WH-00' + (this.warehouses.length + 1),
      address: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      contactPerson: '',
      phone: '',
      email: '',
      capacity: 10000,
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(item: Warehouse): void {
    if (!this.canUpdateWarehouse) return;
    this.isEditing = true;
    this.currentWarehouseId = item.id || null;
    this.warehouseForm = { ...item };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveWarehouse(): void {
    if (!this.warehouseForm.name.trim()) {
      alert('Warehouse Name is required');
      return;
    }

    this.saving = true;
    if (this.isEditing && this.currentWarehouseId) {
      this.warehouseService.updateWarehouse(this.currentWarehouseId, this.warehouseForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.showToast('Warehouse updated successfully!');
          this.loadWarehouses();
        },
        error: (err) => {
          this.saving = false;
          alert('Error updating warehouse: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.warehouseService.createWarehouse(this.warehouseForm, this.activeStoreId).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.showToast('Warehouse created successfully!');
          this.loadWarehouses();
        },
        error: (err) => {
          this.saving = false;
          alert('Error creating warehouse: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  toggleStatus(item: Warehouse): void {
    if (!this.canUpdateWarehouse || !item.id) return;
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = { ...item, status: newStatus as 'ACTIVE' | 'INACTIVE' };
    this.warehouseService.updateWarehouse(item.id, updated).subscribe({
      next: () => {
        item.status = newStatus;
        this.showToast(`Warehouse status changed to ${newStatus}`);
        this.applyFilter();
      }
    });
  }

  deleteWarehouse(id?: number): void {
    if (!this.canDeleteWarehouse || !id) return;
    if (confirm('Are you sure you want to delete this warehouse record?')) {
      this.warehouseService.deleteWarehouse(id).subscribe({
        next: () => {
          this.showToast('Warehouse deleted successfully!');
          this.loadWarehouses();
        }
      });
    }
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = ''; }, 3500);
  }
}

