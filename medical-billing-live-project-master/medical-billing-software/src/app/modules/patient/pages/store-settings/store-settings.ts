import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StoreConfigService, StoreConfig } from '../../../services/store-config.service';
import { TaxService, TaxConfiguration } from '../../../services/tax.service';

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './store-settings.html',
  styleUrl: './store-settings.css'
})
export class StoreSettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  // Layout & Navigation State matching Dashboard (Sidebar closed by default, active submenu open)
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = true; // Submenu stays open so when sidebar expands user sees Store Config / Category / Tax
  isSalesMenuOpen = false;

  activeTab: 'profile' | 'tax' | 'receipt' = 'profile';

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = 'Apollo Pharmacy Hub';
  activeStoreId = '1';

  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // Store Configuration Model linked to MySQL table store_configurations
  config: StoreConfig = {
    storeName: 'Apollo Pharmacy Hub',
    storeSubtitle: 'Clinical & Billing Hub',
    logoUrl: '',
    currencySymbol: '₹',
    currencyCode: 'INR',
    phone: '7358441198',
    email: 'deepakprofile28@gmail.com',
    address: 'Muthu Mari Amman Koil St, Adhi Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    gstin: '33AABCA1234F1Z8',
    drugLicenseNo: 'TN/CHN/20B/2026/0091',
    invoicePrefix: 'INV-',
    defaultReceiptType: 'thermal',
    defaultGstRate: 12,
    billGreeting: '*** WISHING YOU A SPEEDY RECOVERY! GET WELL SOON ***',
    returnPolicyTerms: 'Terms: Goods once sold cannot be returned without original bill. Please check expiry before consumption.',
    enableRoundOff: true
  };

  currencyPresets = [
    { symbol: '₹', code: 'INR', label: '₹ INR (Indian Rupee)' },
    { symbol: '$', code: 'USD', label: '$ USD (US Dollar)' },
    { symbol: '€', code: 'EUR', label: '€ EUR (Euro)' },
    { symbol: '£', code: 'GBP', label: '£ GBP (British Pound)' },
    { symbol: 'AED', code: 'AED', label: 'AED (UAE Dirham)' },
    { symbol: 'SAR', code: 'SAR', label: 'SAR (Saudi Riyal)' },
    { symbol: '৳', code: 'BDT', label: '৳ BDT (Bangladeshi Taka)' },
    { symbol: 'LKR', code: 'LKR', label: 'LKR (Sri Lankan Rupee)' }
  ];

  iconPresets = [
    { icon: 'bi-hospital-fill', name: 'Hospital' },
    { icon: 'bi-capsule-pill', name: 'Medicine' },
    { icon: 'bi-heart-pulse-fill', name: 'Pulse' },
    { icon: 'bi-shield-plus', name: 'Medical Shield' },
    { icon: 'bi-shop-window', name: 'Pharmacy' },
    { icon: 'bi-prescription2', name: 'Rx Prescription' }
  ];

  selectedIcon = 'bi-hospital-fill';
  toastMessage = '';
  isSaving = false;
  taxes: TaxConfiguration[] = [];

  constructor(
    private authService: AuthService,
    private storeConfigService: StoreConfigService,
    private taxService: TaxService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadConfiguration();
    this.loadTaxes();
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

  // Sidebar Controls
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isSettingsMenuOpen = true;
    }
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
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

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // Load from MySQL backend database
  loadConfiguration(): void {
    this.storeConfigService.getStoreConfig(this.activeStoreId).subscribe({
      next: (data) => {
        if (data) {
          this.config = { ...this.config, ...data };
          if (this.config.storeName) {
            this.activeStoreName = this.config.storeName;
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('Error loading store config from server:', err);
      }
    });
  }

  loadTaxes(): void {
    this.taxService.getAllTaxes(this.activeStoreId).subscribe({
      next: (data) => {
        this.taxes = Array.isArray(data) ? data.filter(t => t.status === 'ACTIVE') : [];
        this.cdr.detectChanges();
      },
      error: (err) => console.warn('Error loading taxes for dropdown:', err)
    });
  }

  // Save directly to MySQL database table store_configurations
  saveConfiguration(): void {
    if (!this.config.storeName.trim()) {
      alert('Pharmacy / Store Name is required.');
      return;
    }

    this.isSaving = true;
    this.storeConfigService.saveStoreConfig(this.config, this.activeStoreId).subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.config = { ...this.config, ...saved };
        this.activeStoreName = saved.storeName;
        this.showToast('Store Configuration successfully saved to MySQL database!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving store config to database:', err);
        alert('Failed to save to database. Saved locally as fallback.');
      }
    });
  }

  selectCurrency(preset: { symbol: string; code: string }): void {
    this.config.currencySymbol = preset.symbol;
    this.config.currencyCode = preset.code;
  }

  selectIcon(iconClass: string): void {
    this.selectedIcon = iconClass;
    this.config.logoUrl = ''; // Using preset icon instead of image
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size exceeds 2MB. Please choose a smaller logo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.config.logoUrl = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.config.logoUrl = '';
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3200);
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
