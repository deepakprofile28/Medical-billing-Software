import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MedicineService, Medicine } from '../../../services/medicine.service';
import { AiConsultationService } from '../../../services/ai-consultation.service';
import { AuthService } from '../../../services/auth.service';
import { TaxService, TaxConfiguration } from '../../../services/tax.service';
import { CategoryService, Category } from '../../../services/category.service';
import { RackService, Rack } from '../../../services/rack.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-tablets-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './tablets-inventory.html',
  styleUrl: './tablets-inventory.css'
})
export class TabletsInventory implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  // Permissions
  canUpdateMed = true;
  canDeleteMed = true;

  // Layout & Navigation State matching Dashboard (Closed by default)
  isSidebarCollapsed = true;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = 'Apollo';
  activeStoreId = '1';

  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // Medicine Inventory State
  medicines: Medicine[] = [];
  filteredMedicines: Medicine[] = [];
  loading = false;
  searchQuery = '';
  selectedCategory = 'All';
  categories = ['All', 'Tablets', 'Syrups', 'Injections', 'Antibiotics', 'Vitamins', 'First Aid', 'General'];

  // Form State (Add / Edit)
  isEditMode = false;
  currentEditId: number | null = null;
  formMedicine: Medicine = {
    name: '',
    genericName: '',
    category: 'Tablets',
    batchNo: '',
    expiryDate: '',
    unitPrice: 0,
    mrp: 0,
    gstRate: 12,
    stockQty: 0,
    manufacturer: ''
  };

  // AI Auto-Fill State
  aiLoading = false;

  // Toast & Alert State
  toastMessage = '';
  toastType: 'success' | 'warning' | 'info' = 'success';
  showStockNoticeModal = false;
  taxes: TaxConfiguration[] = [];
  categoriesList: Category[] = [];
  racksList: Rack[] = [];

  constructor(
    private medicineService: MedicineService,
    private aiService: AiConsultationService,
    private authService: AuthService,
    private taxService: TaxService,
    private categoryService: CategoryService,
    private rackService: RackService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  aiAutoFill(): void {
    const name = (this.formMedicine.name || '').trim();
    if (!name) {
      alert('Please enter a Medicine Name first before asking AI to auto-fill.');
      return;
    }

    this.aiLoading = true;
    this.aiService.analyzeDrug(name, this.activeStoreId).subscribe({
      next: (res) => {
        if (res.genericComposition) {
          this.formMedicine.genericName = res.genericComposition;
        }
        if (res.category) {
          const lower = res.category.toLowerCase();
          if (lower.includes('antibiotic')) this.formMedicine.category = 'Antibiotics';
          else if (lower.includes('syrup')) this.formMedicine.category = 'Syrups';
          else if (lower.includes('injection')) this.formMedicine.category = 'Injections';
          else if (lower.includes('vitamin')) this.formMedicine.category = 'Vitamins';
          else this.formMedicine.category = 'Tablets';
        }
        if (!this.formMedicine.manufacturer) {
          if (name.toLowerCase().includes('dolo')) this.formMedicine.manufacturer = 'Micro Labs Ltd';
          else if (name.toLowerCase().includes('pan')) this.formMedicine.manufacturer = 'Alkem Laboratories';
          else if (name.toLowerCase().includes('augmentin')) this.formMedicine.manufacturer = 'GlaxoSmithKline (GSK)';
          else if (name.toLowerCase().includes('azithral')) this.formMedicine.manufacturer = 'Alembic Pharmaceuticals';
          else if (name.toLowerCase().includes('cetzine')) this.formMedicine.manufacturer = 'Dr. Reddy\'s Laboratories';
          else this.formMedicine.manufacturer = 'Cipla Ltd';
        }
        this.aiLoading = false;
        this.showToast(`✨ AI auto-filled composition & saved to MySQL table!`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error in AI auto-fill:', err);
        this.aiLoading = false;
        alert('AI service currently unavailable. Please verify backend is running on port 8082.');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.canUpdateMed = this.accessService.canUpdate('TABLETS');
    this.canDeleteMed = this.accessService.canDelete('TABLETS');
    this.accessService.permissions$.subscribe(() => {
      this.canUpdateMed = this.accessService.canUpdate('TABLETS');
      this.canDeleteMed = this.accessService.canDelete('TABLETS');
      this.cdr.detectChanges();
    });

    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadMedicines();
    this.loadTaxes();
    this.loadCategories();
    this.loadRacks();
  }

  loadTaxes(): void {
    this.taxService.getAllTaxes(this.activeStoreId).subscribe({
      next: (data) => {
        this.taxes = Array.isArray(data) ? data.filter(t => t.status === 'ACTIVE') : [];
        const defaultTax = this.taxes.find(t => t.isDefault);
        if (defaultTax && (!this.formMedicine.gstRate || this.formMedicine.gstRate === 12)) {
          this.formMedicine.gstRate = defaultTax.gstRate;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.warn('Error loading taxes in tablets inventory:', err)
    });
  }

  
  loadRacks(): void {
    this.rackService.getRacks(this.activeStoreId, true).subscribe({
      next: (data) => {
        this.racksList = Array.isArray(data) ? data : [];
      },
      error: (err) => console.error('Error loading racks', err)
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories(this.activeStoreId, true).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.categoriesList = data;
          this.categories = ['All', ...data.map(c => c.name)];
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.warn('Error loading categories in tablets inventory:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private initContext(): void {
    this.loggedInUser = this.authService.getUserName() || localStorage.getItem('companyName') || 'Apollo';
    this.userRole = (this.authService.getRole() || 'ADMIN').toUpperCase();
    this.activeStoreName = localStorage.getItem('companyName') || 'Apollo';
    this.activeStoreId = localStorage.getItem('companyId') || '1';
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

  

  

  

  

  

  
  

  

  

  

  

  

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  loadMedicines(): void {
    this.loading = true;
    this.medicineService.getAllMedicines(this.activeStoreId).subscribe({
      next: (data) => {
        this.medicines = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching medicines from MySQL:', err);
        this.medicines = [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterByCategory(cat: string): void {
    this.selectedCategory = cat;
    this.applyFilter();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    const q = (this.searchQuery || '').toLowerCase().trim();
    this.filteredMedicines = (this.medicines || []).filter(m => {
      if (!m) return false;
      const matchCat = (this.selectedCategory === 'All') || (m.category === this.selectedCategory);
      if (!matchCat) return false;
      if (!q) return true;
      return (m.name || '').toLowerCase().includes(q) ||
             (m.genericName || '').toLowerCase().includes(q) ||
             (m.batchNo || '').toLowerCase().includes(q) ||
             (m.manufacturer || '').toLowerCase().includes(q);
    });
  }

  // Modal & Edit State
  showMedModal = false;
  isSavingMed = false;

  // =====================================================
  // ADD / UPDATE MEDICINE
  // =====================================================
  saveMedicine(): void {
    if (!this.formMedicine.name.trim()) {
      alert('Please enter a Medicine Name.');
      return;
    }
    if (this.formMedicine.unitPrice <= 0) {
      alert('Please enter a valid Selling Price.');
      return;
    }

    this.isSavingMed = true;
    const payload: Medicine = {
      name: this.formMedicine.name.trim(),
      genericName: this.formMedicine.genericName ? this.formMedicine.genericName.trim() : '',
      category: this.formMedicine.category || 'Tablets',
      batchNo: this.formMedicine.batchNo ? this.formMedicine.batchNo.trim() : '',
      expiryDate: this.formMedicine.expiryDate ? this.formMedicine.expiryDate.trim() : '',
      unitPrice: Number(this.formMedicine.unitPrice) || 0,
      mrp: Number(this.formMedicine.mrp) || Number(this.formMedicine.unitPrice) || 0,
      gstRate: Number(this.formMedicine.gstRate) !== undefined ? Number(this.formMedicine.gstRate) : 12,
      stockQty: (this.isEditMode && this.currentEditId)
        ? ((this.medicines.find(m => m.id === this.currentEditId)?.stockQty) ?? Number(this.formMedicine.stockQty) ?? 0)
        : 0,
      manufacturer: this.formMedicine.manufacturer ? this.formMedicine.manufacturer.trim() : '',
      companyId: this.activeStoreId
    };

    if (this.isEditMode && this.currentEditId) {
      this.medicineService.updateMedicine(this.currentEditId, payload).subscribe({
        next: () => {
          this.isSavingMed = false;
          this.showMedModal = false;
          this.showToast(`Updated "${this.formMedicine.name}" successfully!`);
          this.resetForm();
          this.loadMedicines();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSavingMed = false;
          console.error('Error updating medicine:', err);
          alert('Failed to update medicine. Please verify backend is running on port 8082.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.medicineService.addMedicine(payload, this.activeStoreId).subscribe({
        next: () => {
          this.isSavingMed = false;
          this.showMedModal = false;
          this.showToast(`Added "${this.formMedicine.name}" to database!`);
          this.resetForm();
          this.loadMedicines();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSavingMed = false;
          console.error('Error adding medicine:', err);
          alert('Failed to add medicine. Please verify backend is running on port 8082.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  saveAsNewMedicine(): void {
    if (!this.formMedicine.name.trim()) {
      alert('Please enter a Medicine Name.');
      return;
    }
    if (this.formMedicine.unitPrice <= 0) {
      alert('Please enter a valid Selling Price.');
      return;
    }

    this.isSavingMed = true;
    const payload: Medicine = {
      name: this.formMedicine.name.trim(),
      genericName: this.formMedicine.genericName ? this.formMedicine.genericName.trim() : '',
      category: this.formMedicine.category || 'Tablets',
      batchNo: this.formMedicine.batchNo ? this.formMedicine.batchNo.trim() : '',
      expiryDate: this.formMedicine.expiryDate ? this.formMedicine.expiryDate.trim() : '',
      unitPrice: Number(this.formMedicine.unitPrice) || 0,
      mrp: Number(this.formMedicine.mrp) || Number(this.formMedicine.unitPrice) || 0,
      gstRate: Number(this.formMedicine.gstRate) !== undefined ? Number(this.formMedicine.gstRate) : 12,
      stockQty: 0,
      manufacturer: this.formMedicine.manufacturer ? this.formMedicine.manufacturer.trim() : '',
      companyId: this.activeStoreId
    };

    this.medicineService.addMedicine(payload, this.activeStoreId).subscribe({
      next: (res) => {
        this.isSavingMed = false;
        this.showMedModal = false;
        this.showToast(`Created new unique entry for "${this.formMedicine.name}" (ID: #${res.id || ''}) in database!`);
        this.resetForm();
        this.loadMedicines();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingMed = false;
        console.error('Error creating unique medicine entry:', err);
        alert('Failed to create new unique entry. Please verify backend is running on port 8082.');
        this.cdr.detectChanges();
      }
    });
  }

  editMedicine(m: Medicine): void {
    if (!this.canUpdateMed) {
      this.showToast('Permission Denied: Update permission required.');
      return;
    }

    this.isEditMode = true;
    this.currentEditId = m.id || null;
    this.formMedicine = {
      name: m.name || '',
      genericName: m.genericName || '',
      category: m.category || 'Tablets',
      batchNo: m.batchNo || '',
      expiryDate: m.expiryDate || '',
      unitPrice: m.unitPrice || 0,
      mrp: m.mrp || m.unitPrice || 0,
      gstRate: m.gstRate !== undefined && m.gstRate !== null ? m.gstRate : 12,
      stockQty: m.stockQty !== undefined && m.stockQty !== null ? m.stockQty : 0,
      manufacturer: m.manufacturer || ''
    };
    this.showMedModal = true;
    
    // Also scroll the main container to top if user closes modal to view top card
    const mainArea = document.querySelector('.app-main-content');
    if (mainArea) {
      mainArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
    this.showToast(`Editing "${m.name}"`);
    this.cdr.detectChanges();
  }

  openAddModal(): void {
    this.resetForm();
    this.isEditMode = false;
    this.showMedModal = true;
    this.cdr.detectChanges();
  }

  closeMedModal(): void {
    this.showMedModal = false;
    this.resetForm();
  }

  deleteMedicine(m: Medicine): void {
    if (!this.canDeleteMed) {
      this.showToast('Permission Denied: Delete permission required.');
      return;
    }

    if (!m.id) return;
    if (confirm(`Are you sure you want to delete "${m.name}" from database?`)) {
      this.medicineService.deleteMedicine(m.id).subscribe({
        next: () => {
          this.showToast(`Deleted "${m.name}" from database.`);
          this.loadMedicines();
        },
        error: (err) => {
          console.error('Error deleting medicine:', err);
          alert('Failed to delete medicine.');
        }
      });
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentEditId = null;
    this.formMedicine = {
      name: '',
      genericName: '',
      category: 'Tablets',
      batchNo: '',
      expiryDate: '',
      unitPrice: 0,
      mrp: 0,
      gstRate: 12,
      stockQty: 0,
      manufacturer: ''
    };
  }

  goToPos(): void {
    this.router.navigate(['/pos']);
  }

  onStockFieldAttempt(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showToast('⚠️ To increase stock, please go to Purchase Module to purchase stock!', 'warning');
    this.showStockNoticeModal = true;
    this.cdr.detectChanges();
  }

  goToPurchase(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showStockNoticeModal = false;
    this.showMedModal = false;
    this.router.navigate(['/purchase']);
  }

  showToast(msg: string, type: 'success' | 'warning' | 'info' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3500);
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
