import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StoreConfigService, StoreConfig } from '../../../services/store-config.service';
import { TaxService, TaxConfiguration } from '../../../services/tax.service';
import { ThemeService, PRESET_THEMES, ThemePreset } from '../../../services/theme.service';
import { MedicineService, Medicine } from '../../../services/medicine.service';
import { AudioAlertService } from '../../../services/audio-alert.service';

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
  isSidebarCollapsed = true;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false; // Submenu stays open so when sidebar expands user sees Store Config / Category / Tax
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

  // Theme & Color Customizer State
  customColorInput: string = '#10b981';
  activeHexColor: string = '#10b981';
  colorInputError: boolean = false;
  colorPresets: ThemePreset[] = PRESET_THEMES;

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
    enableRoundOff: false,
    roundingMode: 'decimal',
    themeColor: '#10b981',
    alertQuantity: 10
  };

  // Alert Quantity State & Popup
  showAlertPopup = false;
  lowStockMedicines: Medicine[] = [];
  loadingLowStock = false;
  alertPopupThreshold = 10;

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
    private themeService: ThemeService,
    private medicineService: MedicineService,
    private audioAlert: AudioAlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initContext();
    this.initThemeState();
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

  private initThemeState(): void {
    this.customColorInput = this.themeService.getUserInput();
    this.activeHexColor = this.themeService.resolveColorToHex(this.customColorInput) || '#10b981';
    this.config.themeColor = this.activeHexColor;
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
          if (this.config.roundingMode) {
            this.config.enableRoundOff = (this.config.roundingMode === 'round_off');
          } else if (this.config.enableRoundOff !== undefined) {
            this.config.roundingMode = this.config.enableRoundOff ? 'round_off' : 'decimal';
          }
          if (this.config.themeColor) {
            this.activeHexColor = this.config.themeColor;
            this.customColorInput = this.themeService.getUserInput() || this.config.themeColor;
            this.themeService.applyTheme(this.config.themeColor);
          }
          if (this.config.alertQuantity !== undefined && this.config.alertQuantity !== null) {
            this.config.alertQuantity = Number(this.config.alertQuantity);
          } else {
            this.config.alertQuantity = 10;
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('Error loading store config from server:', err);
      }
    });
  }

  setRoundingMode(mode: 'round_off' | 'decimal'): void {
    this.config.roundingMode = mode;
    this.config.enableRoundOff = (mode === 'round_off');
    this.cdr.detectChanges();
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

  // Live Color Input Handler (Accepts hex e.g. #0284c7 or color name e.g. blue, green, purple)
  onColorInputChange(val: string): void {
    this.customColorInput = val;
    const resolved = this.themeService.resolveColorToHex(val);
    if (resolved) {
      this.colorInputError = false;
      this.activeHexColor = resolved;
      this.config.themeColor = resolved;
      this.themeService.applyTheme(val);
    } else {
      this.colorInputError = true;
    }
    this.cdr.detectChanges();
  }

  onColorPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.customColorInput = input.value;
      this.onColorInputChange(input.value);
    }
  }

  selectPresetColor(preset: ThemePreset): void {
    this.customColorInput = preset.name;
    this.activeHexColor = preset.color;
    this.colorInputError = false;
    this.config.themeColor = preset.color;
    this.themeService.applyTheme(preset.color);
    this.cdr.detectChanges();
  }

  // Save directly to MySQL database table store_configurations
  saveConfiguration(): void {
    if (!this.config.storeName.trim()) {
      alert('Pharmacy / Store Name is required.');
      return;
    }

    this.config.themeColor = this.activeHexColor;
    if (this.config.roundingMode) {
      this.config.enableRoundOff = (this.config.roundingMode === 'round_off');
    } else {
      this.config.roundingMode = this.config.enableRoundOff ? 'round_off' : 'decimal';
    }
    this.isSaving = true;
    this.themeService.applyTheme(this.customColorInput);

    this.storeConfigService.saveStoreConfig(this.config, this.activeStoreId).subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.config = { ...this.config, ...saved };
        this.activeStoreName = saved.storeName;
        this.showToast('Store Configuration & Alert Quantity saved successfully!');
        this.cdr.detectChanges();

        // Trigger alert popup to show user the configured alert threshold in action!
        if (this.config.alertQuantity !== undefined && this.config.alertQuantity !== null) {
          this.triggerAlertPopup();
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving store config to database:', err);
        this.showToast('Saved theme & settings locally.');
        if (this.config.alertQuantity !== undefined && this.config.alertQuantity !== null) {
          this.triggerAlertPopup();
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Alert Quantity Handlers & Popup Triggers
  onAlertQuantityChange(qty: number): void {
    const val = Number(qty);
    this.config.alertQuantity = isNaN(val) || val < 0 ? 0 : val;
    this.cdr.detectChanges();
  }

  setPresetAlertQuantity(qty: number): void {
    this.config.alertQuantity = qty;
    this.triggerAlertPopup(true);
    this.cdr.detectChanges();
  }

  triggerAlertPopup(testOnly = false): void {
    const threshold = this.config.alertQuantity !== undefined && this.config.alertQuantity !== null 
      ? Number(this.config.alertQuantity) : 10;
    this.alertPopupThreshold = threshold;
    this.loadingLowStock = true;
    this.showAlertPopup = true;

    this.medicineService.getAllMedicines(this.activeStoreId).subscribe({
      next: (meds) => {
        this.loadingLowStock = false;
        const list = Array.isArray(meds) ? meds : [];
        this.lowStockMedicines = list.filter(m => (m.stockQty ?? 0) <= threshold);
        this.cdr.detectChanges();

        // Play alarm chime sound and speak voice announcement
        if (this.lowStockMedicines.length > 0) {
          const items = this.lowStockMedicines.map(m => ({ name: m.name, stock: m.stockQty ?? 0 }));
          this.audioAlert.triggerBatchLowStockAlert(items, threshold);
        } else {
          this.audioAlert.playAlarmChime(2);
          setTimeout(() => {
            this.audioAlert.speak(`Alert threshold is configured to ${threshold} units. All inventory items are currently well-stocked.`);
          }, 450);
        }
      },
      error: (err) => {
        this.loadingLowStock = false;
        console.warn('Error loading medicines for alert popup:', err);
        this.lowStockMedicines = [];
        this.cdr.detectChanges();
        this.audioAlert.playAlarmChime(2);
      }
    });
  }

  replayAlertVoice(): void {
    const threshold = this.alertPopupThreshold || 10;
    if (this.lowStockMedicines.length > 0) {
      const items = this.lowStockMedicines.map(m => ({ name: m.name, stock: m.stockQty ?? 0 }));
      this.audioAlert.triggerBatchLowStockAlert(items, threshold);
    } else {
      this.audioAlert.playAlarmChime(2);
      this.audioAlert.speak(`Alert threshold is configured to ${threshold} units. All inventory items are currently well-stocked.`);
    }
  }

  closeAlertPopup(): void {
    this.showAlertPopup = false;
    this.cdr.detectChanges();
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
