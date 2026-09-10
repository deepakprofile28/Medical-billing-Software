import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BrandService, Brand } from '../../../services/brand.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-brand-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './brand-settings.html',
  styleUrl: './brand-settings.css'
})
export class BrandSettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  canUpdateBrand = true;
  canDeleteBrand = true;

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

  brands: Brand[] = [];
  filteredBrands: Brand[] = [];
  loading = false;
  searchQuery = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  showModal = false;
  isEditing = false;
  saving = false;
  currentBrandId: number | null = null;

  brandForm: Brand = {
    name: '',
    code: '',
    manufacturer: '',
    description: '',
    logoUrl: '',
    status: 'ACTIVE'
  };

  toastMessage = '';

  constructor(
    private authService: AuthService,
    private brandService: BrandService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canUpdateBrand = this.accessService.canUpdate('SETTINGS');
    this.canDeleteBrand = this.accessService.canDelete('SETTINGS');
    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadBrands();
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
  
  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

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

  loadBrands(): void {
    this.loading = true;
    this.brandService.getAllBrands(this.activeStoreId).subscribe({
      next: (data) => {
        this.brands = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load brands:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.brands];
    if (this.filterStatus !== 'ALL') {
      result = result.filter(b => (b.status || 'ACTIVE').toUpperCase() === this.filterStatus);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.manufacturer && b.manufacturer.toLowerCase().includes(q))
      );
    }
    this.filteredBrands = result;
  }

  onSearchChange(): void { this.applyFilter(); }
  setFilterStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentBrandId = null;
    this.brandForm = {
      name: '',
      code: 'BR-00' + (this.brands.length + 1),
      manufacturer: '',
      description: '',
      logoUrl: '',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(item: Brand): void {
    if (!this.canUpdateBrand) return;
    this.isEditing = true;
    this.currentBrandId = item.id || null;
    this.brandForm = { ...item };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveBrand(): void {
    if (!this.brandForm.name.trim()) {
      alert('Brand Name is required');
      return;
    }

    this.saving = true;
    if (this.isEditing && this.currentBrandId) {
      this.brandService.updateBrand(this.currentBrandId, this.brandForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.showToast('Brand updated successfully!');
          this.loadBrands();
        },
        error: (err) => {
          this.saving = false;
          alert('Error updating brand: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.brandService.createBrand(this.brandForm, this.activeStoreId).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.showToast('Brand created successfully!');
          this.loadBrands();
        },
        error: (err) => {
          this.saving = false;
          alert('Error creating brand: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  toggleStatus(item: Brand): void {
    if (!this.canUpdateBrand || !item.id) return;
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = { ...item, status: newStatus as 'ACTIVE' | 'INACTIVE' };
    this.brandService.updateBrand(item.id, updated).subscribe({
      next: () => {
        item.status = newStatus;
        this.showToast(`Brand status changed to ${newStatus}`);
        this.applyFilter();
      }
    });
  }

  deleteBrand(id?: number): void {
    if (!this.canDeleteBrand || !id) return;
    if (confirm('Are you sure you want to delete this brand record?')) {
      this.brandService.deleteBrand(id).subscribe({
        next: () => {
          this.showToast('Brand deleted successfully!');
          this.loadBrands();
        }
      });
    }
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = ''; }, 3500);
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
