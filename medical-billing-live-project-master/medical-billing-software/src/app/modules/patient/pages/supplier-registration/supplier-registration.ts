import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  isSidebarCollapsed = true;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = true;

  // Sidebar counters
  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

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

  // Document Preview Modal State
  showDocPreviewModal = false;
  previewDocTitle = '';
  previewDocName = '';
  previewDocUrlRaw = '';
  safeDocPreviewUrl: SafeResourceUrl | null = null;

  form: Supplier = {
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    drugLicenseNo: '',
    panNumber: '',
    fssaiLicenseNo: '',
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
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
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
    this.form.code = this.supplierService.generateUniqueSupplierCode();
    this.cdr.markForCheck();
  }

  private loadSupplierDetails(id: number): void {
    this.loading = true;
    this.supplierService.getSupplierById(id).subscribe({
      next: async (data) => {
        if (data) {
          this.form = { ...data };
          await this.hydrateFormDocuments();
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

  private async hydrateFormDocuments(): Promise<void> {
    const docKeys: (keyof Supplier)[] = [
      'gstCertificate',
      'drugLicenseDoc',
      'panDoc',
      'fssaiDoc',
      'visitingCardDoc',
      'chequeDoc',
      'agreementDoc'
    ];

    for (const key of docKeys) {
      const val = (this.form as any)[key];
      if (typeof val === 'string' && val.startsWith('idb:')) {
        const resolved = await this.supplierService.resolveDocument(val, this.form.id, String(key));
        if (resolved) {
          (this.form as any)[key] = resolved;
        }
      }
    }
  }

  saveSupplier(): void {
    if (!this.form.name || !this.form.name.trim()) {
      this.showFeedback('Please enter Supplier / Vendor Name', 'danger');
      return;
    }
    if (!this.form.contactPerson || !this.form.contactPerson.trim()) {
      this.form.contactPerson = this.form.name.trim();
    }
    if (!this.form.phone || !this.form.phone.trim()) {
      this.form.phone = 'N/A';
    }
    if (!this.form.city || !this.form.city.trim()) {
      this.form.city = 'Chennai';
    }
    if (!this.form.state || !this.form.state.trim()) {
      this.form.state = 'Tamil Nadu';
    }
    if (!this.form.code || !this.form.code.trim()) {
      this.form.code = this.supplierService.generateUniqueSupplierCode();
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

  // ========================================================
  // DOCUMENT UPLOAD, VIEW, REMOVE & DOWNLOAD HANDLERS
  // ========================================================
  onDocumentUpload(event: Event, docKey: keyof Supplier, docLabel: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.showFeedback('File size exceeds 5MB limit. Please choose a smaller document.', 'danger');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      (this.form as any)[docKey] = dataUrl;
      (this.form as any)[`${String(docKey)}Name`] = file.name;
      this.showFeedback(`${docLabel} attached successfully!`, 'success');
      this.cdr.markForCheck();
    };
    reader.onerror = () => {
      this.showFeedback(`Failed to read ${docLabel}. Please try again.`, 'danger');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeDocument(docKey: keyof Supplier, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    (this.form as any)[docKey] = undefined;
    (this.form as any)[`${String(docKey)}Name`] = undefined;
    this.showFeedback('Document removed.', 'success');
    this.cdr.markForCheck();
  }

  async viewDocument(dataUrl?: string, name?: string, title?: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!dataUrl) return;

    if (dataUrl.startsWith('idb:')) {
      const resolved = await this.supplierService.resolveDocument(dataUrl, this.form.id);
      if (resolved) {
        dataUrl = resolved;
      } else {
        this.showFeedback('Unable to load document preview.', 'danger');
        return;
      }
    }

    this.previewDocTitle = title || 'Document Preview';
    this.previewDocName = name || 'document';
    this.previewDocUrlRaw = dataUrl;
    this.safeDocPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
    this.showDocPreviewModal = true;
    this.cdr.markForCheck();
  }

  closeDocPreviewModal(): void {
    this.showDocPreviewModal = false;
    this.safeDocPreviewUrl = null;
    this.previewDocUrlRaw = '';
    this.cdr.markForCheck();
  }

  async downloadDocument(dataUrl?: string, name?: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!dataUrl) return;

    if (dataUrl.startsWith('idb:')) {
      const resolved = await this.supplierService.resolveDocument(dataUrl, this.form.id);
      if (resolved) {
        dataUrl = resolved;
      } else {
        this.showFeedback('Unable to download document.', 'danger');
        return;
      }
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name || 'supplier-document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  isPdf(fileName?: string): boolean {
    if (!fileName) return false;
    return fileName.toLowerCase().endsWith('.pdf');
  }

  // Sidebar Toggles
  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  logout(): void {
    this.authService.logout();
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
