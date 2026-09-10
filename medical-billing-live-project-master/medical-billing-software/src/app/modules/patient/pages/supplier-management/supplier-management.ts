import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Supplier, SupplierService } from '../../../services/supplier.service';
@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './supplier-management.html',
  styleUrl: './supplier-management.css',
})
export class SupplierManagement implements OnInit, OnDestroy {
  // Sidebar states
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = true;

  // Header & User Info
  loggedInUser = 'ApolloAdmin';
  userRole = 'Admin';
  activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';
  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // Sidebar counters
  totalPatientsCount = 0;
  draftsCount = 0;
  totalUsersCount = 0;

  // Suppliers Data & Filter
  suppliers: Supplier[] = [];
  searchQuery = '';
  statusFilter = 'ALL'; // 'ALL', 'ACTIVE', 'INACTIVE'
  loading = false;
  saving = false;

  // Modal State
  showModal = false;
  isEditing = false;
  editingId?: number;

  form: Supplier = {
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentTerms: 'Net 30 Days',
    status: 'ACTIVE'
  };

  paymentTermOptions = [
    'Immediate / Cash',
    'Net 15 Days',
    'Net 30 Days',
    'Net 45 Days',
    'Net 60 Days',
    'Advance 100%'
  ];

  constructor(
    private supplierService: SupplierService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);

    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.loggedInUser = user.name;
    }
    this.activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
    this.activeStoreId = localStorage.getItem('companyId') || '1';

    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  loadSuppliers(): void {
    this.loading = true;
    this.supplierService.getAllSuppliers(this.activeStoreId).subscribe({
      next: (data) => {
        this.suppliers = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.loading = false;
      }
    });
  }

  get filteredSuppliers(): Supplier[] {
    let list = this.suppliers;
    if (this.statusFilter !== 'ALL') {
      list = list.filter(s => s.status === this.statusFilter);
    }
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) return list;

    return list.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.gstin && s.gstin.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  }

  get activeCount(): number {
    return this.suppliers.filter(s => s.status === 'ACTIVE').length;
  }

  get inactiveCount(): number {
    return this.suppliers.filter(s => s.status === 'INACTIVE').length;
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingId = undefined;
    const nextNum = this.suppliers.length + 1;
    this.form = {
      name: '',
      code: `SUP-00${nextNum}`,
      contactPerson: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
      paymentTerms: 'Net 30 Days',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(s: Supplier): void {
    this.isEditing = true;
    this.editingId = s.id;
    this.form = { ...s };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveSupplier(): void {
    if (!this.form.name || !this.form.phone) {
      alert('Please enter Supplier Name and Phone Number.');
      return;
    }

    this.saving = true;
    if (this.isEditing && this.editingId) {
      this.supplierService.updateSupplier(this.editingId, this.form).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadSuppliers();
        },
        error: () => {
          this.saving = false;
          this.showModal = false;
          this.loadSuppliers();
        }
      });
    } else {
      this.supplierService.createSupplier(this.form, this.activeStoreId).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadSuppliers();
        },
        error: () => {
          this.saving = false;
          this.showModal = false;
          this.loadSuppliers();
        }
      });
    }
  }

  toggleStatus(s: Supplier): void {
    const newStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (s.id) {
      this.supplierService.updateSupplier(s.id, { ...s, status: newStatus }).subscribe({
        next: () => {
          s.status = newStatus;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteSupplier(s: Supplier): void {
    if (!confirm(`Are you sure you want to delete supplier "${s.name}"?`)) {
      return;
    }
    if (s.id) {
      this.supplierService.deleteSupplier(s.id).subscribe({
        next: () => {
          this.loadSuppliers();
        }
      });
    }
  }

  // Sidebar controls
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
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

  toggleSalesMenu(): void {
    this.isSalesMenuOpen = !this.isSalesMenuOpen;
  }

  togglePurchaseMenu(): void {
    this.isPurchaseMenuOpen = !this.isPurchaseMenuOpen;
  }

  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

  openPatientFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
  }

  openSalesFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSalesMenuOpen = true;
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.btn-sidebar-toggle') || document.querySelector('.toggle-btn');
    const target = event.target as Node;

    if (sidebar && !sidebar.contains(target) && (!toggleBtn || !toggleBtn.contains(target))) {
      this.closeAllMenus();
    }
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

