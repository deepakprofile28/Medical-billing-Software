import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Supplier, SupplierService } from '../../../services/supplier.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-supplier-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './supplier-registration.html',
  styleUrl: './supplier-registration.css'
})
export class SupplierRegistration implements OnInit, OnDestroy {
  // Sidebar state
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

  // Form & Editing State
  isEditing = false;
  supplierId?: number;
  saving = false;
  loading = false;

  form: Supplier = {
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    drugLicenseNo: '',
    creditLimit: 50000,
    paymentTerms: 'Net 30 Days',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    notes: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600032',
    status: 'ACTIVE'
  };

  paymentTermOptions: string[] = [
    'Immediate / Cash',
    'Net 15 Days',
    'Net 30 Days',
    'Net 45 Days',
    'Net 60 Days',
    'Advance 100%'
  ];

  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';
  showToast = false;

  constructor(
    private supplierService: SupplierService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startClock();
    this.initUser();

    // Check if editing via route param
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.supplierId = Number(params['id']);
        this.isEditing = true;
        this.loadSupplierDetails(this.supplierId);
      } else {
        this.generateSupplierCode();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private startClock(): void {
    const updateTime = () => {
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
      this.cdr.markForCheck();
    };
    updateTime();
    this.clockTimer = setInterval(updateTime, 1000);
  }

  private initUser(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.loggedInUser = user.name;
    }
    this.activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
    this.activeStoreId = localStorage.getItem('companyId') || '1';
  }

  private generateSupplierCode(): void {
    this.supplierService.getAllSuppliers(this.activeStoreId).subscribe(list => {
      const nextNum = (list ? list.length : 0) + 1;
      this.form.code = `SUP-00${nextNum}`;
      this.cdr.markForCheck();
    });
  }

  private loadSupplierDetails(id: number): void {
    this.loading = true;
    this.supplierService.getSupplierById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form = { ...data };
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.showFeedback('Failed to load supplier details', 'danger');
      }
    });
  }

  saveSupplier(): void {
    if (!this.form.name.trim()) {
      this.showFeedback('Please enter Supplier / Vendor Name', 'danger');
      return;
    }
    if (!this.form.contactPerson?.trim()) {
      this.showFeedback('Please enter Contact Person Name', 'danger');
      return;
    }
    if (!this.form.phone.trim()) {
      this.showFeedback('Please enter Contact Phone Number', 'danger');
      return;
    }

    this.saving = true;

    if (this.isEditing && this.supplierId) {
      this.supplierService.updateSupplier(this.supplierId, this.form).subscribe({
        next: () => {
          this.saving = false;
          this.showFeedback('Supplier updated successfully!', 'success');
          setTimeout(() => {
            this.router.navigate(['/supplier-list']);
          }, 1200);
        },
        error: () => {
          this.saving = false;
          this.showFeedback('Failed to update supplier', 'danger');
        }
      });
    } else {
      this.supplierService.createSupplier(this.form, this.activeStoreId).subscribe({
        next: () => {
          this.saving = false;
          this.showFeedback('Supplier registered successfully!', 'success');
          setTimeout(() => {
            this.router.navigate(['/supplier-list']);
          }, 1200);
        },
        error: () => {
          this.saving = false;
          this.showFeedback('Failed to register supplier', 'danger');
        }
      });
    }
  }

  resetForm(): void {
    this.form = {
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      gstin: '',
      drugLicenseNo: '',
      creditLimit: 50000,
      paymentTerms: 'Net 30 Days',
      bankName: '',
      bankAccountNumber: '',
      ifscCode: '',
      notes: '',
      address: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600032',
      status: 'ACTIVE'
    };
    this.generateSupplierCode();
  }

  showFeedback(msg: string, type: 'success' | 'danger'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.markForCheck();
    }, 3500);
  }

  // Sidebar Toggles
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
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
    const sidebar = document.querySelector('.app-sidebar');
    const toggleBtn = document.querySelector('.btn-toggle-sidebar') || document.querySelector('.btn-sidebar-toggle-mobile');
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

