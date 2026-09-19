import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  isSidebarCollapsed = true;
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
  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

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

  // Attached Documents Modal & Preview State
  showDocModal = false;
  selectedSupplierForDocs?: Supplier;
  attachedDocsList: Array<{ key: string; label: string; name: string; url?: string }> = [];
  previewDocTitle = '';
  previewDocName = '';
  previewDocUrlRaw = '';
  safeDocPreviewUrl: SafeResourceUrl | null = null;
  showDocPreviewModal = false;
  docLoading = false;

  constructor(
    private supplierService: SupplierService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
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

  // ==========================================
  // ATTACHED DOCUMENTS & PREVIEW HANDLERS
  // ==========================================
  getDocCount(s: Supplier): number {
    const keys: (keyof Supplier)[] = [
      'gstCertificate', 'drugLicenseDoc', 'panDoc', 'fssaiDoc',
      'visitingCardDoc', 'chequeDoc', 'agreementDoc'
    ];
    let count = 0;
    for (const k of keys) {
      const nameKey = `${String(k)}Name` as keyof Supplier;
      if (s[k] || (s as any)[nameKey]) {
        count++;
      }
    }
    return count;
  }

  getAttachedDocs(s: Supplier): Array<{ key: string; label: string; name: string; url?: string }> {
    const docDefs = [
      { key: 'gstCertificate', label: 'GST Certificate', nameKey: 'gstCertificateName' },
      { key: 'drugLicenseDoc', label: 'Drug License Form 20B/21B', nameKey: 'drugLicenseDocName' },
      { key: 'panDoc', label: 'PAN Card', nameKey: 'panDocName' },
      { key: 'fssaiDoc', label: 'FSSAI License', nameKey: 'fssaiDocName' },
      { key: 'visitingCardDoc', label: 'Visiting Card / ID', nameKey: 'visitingCardDocName' },
      { key: 'chequeDoc', label: 'Cancelled Cheque', nameKey: 'chequeDocName' },
      { key: 'agreementDoc', label: 'Vendor Agreement / MSME', nameKey: 'agreementDocName' }
    ];

    const list: Array<{ key: string; label: string; name: string; url?: string }> = [];
    for (const d of docDefs) {
      const val = (s as any)[d.key];
      const name = (s as any)[d.nameKey];
      if (val || name) {
        list.push({
          key: d.key,
          label: d.label,
          name: name || `${d.label}.pdf`,
          url: val
        });
      }
    }
    return list;
  }

  openDocModal(s: Supplier, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.selectedSupplierForDocs = s;
    this.attachedDocsList = this.getAttachedDocs(s);
    this.showDocModal = true;
    this.showDocPreviewModal = false;
    this.safeDocPreviewUrl = null;
    this.cdr.detectChanges();
  }

  closeDocModal(): void {
    this.showDocModal = false;
    this.selectedSupplierForDocs = undefined;
    this.attachedDocsList = [];
    this.closeDocPreviewModal();
    this.cdr.detectChanges();
  }

  async viewSupplierDoc(docItem: { key: string; label: string; name: string; url?: string }, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.docLoading = true;
    this.cdr.detectChanges();

    let docUrl = docItem.url;
    if (!docUrl || docUrl.startsWith('idb:')) {
      const resolved = await this.supplierService.resolveDocument(docUrl, this.selectedSupplierForDocs?.id, docItem.key);
      if (resolved) {
        docUrl = resolved;
      }
    }

    this.docLoading = false;
    if (!docUrl) {
      alert('Document data could not be retrieved.');
      this.cdr.detectChanges();
      return;
    }

    this.previewDocTitle = `${docItem.label} - ${this.selectedSupplierForDocs?.name || 'Supplier'}`;
    this.previewDocName = docItem.name;
    this.previewDocUrlRaw = docUrl;
    this.safeDocPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(docUrl);
    this.showDocPreviewModal = true;
    this.cdr.detectChanges();
  }

  closeDocPreviewModal(): void {
    this.showDocPreviewModal = false;
    this.safeDocPreviewUrl = null;
    this.previewDocUrlRaw = '';
    this.cdr.detectChanges();
  }

  async downloadSupplierDoc(docItem: { key: string; label: string; name: string; url?: string }, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    let docUrl = docItem.url;
    if (!docUrl || docUrl.startsWith('idb:')) {
      const resolved = await this.supplierService.resolveDocument(docUrl, this.selectedSupplierForDocs?.id, docItem.key);
      if (resolved) {
        docUrl = resolved;
      }
    }

    if (!docUrl) {
      alert('Document data could not be retrieved for download.');
      return;
    }

    const link = document.createElement('a');
    link.href = docUrl;
    link.download = docItem.name || 'supplier-document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  isPdf(fileName?: string): boolean {
    if (!fileName) return false;
    return fileName.toLowerCase().endsWith('.pdf');
  }

  // Sidebar controls
  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

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
