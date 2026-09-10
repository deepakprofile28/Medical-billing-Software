import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PurchaseService, Purchase, PurchaseReturn } from '../../../../services/purchase.service';
import { MedicineService, Medicine } from '../../../../services/medicine.service';
import { SupplierService, Supplier } from '../../../../services/supplier.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-purchase-returns-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './purchase-returns-list.html',
  styleUrl: './purchase-returns-list.css',
})
export class PurchaseReturnsList implements OnInit, OnDestroy {
  // Sidebar states
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;
  isPurchaseMenuOpen = true;
  isSupplierMenuOpen = false;

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

  // Modal & Form State
  showModal = false;
  saving = false;
  loading = false;
  searchQuery = '';

  form: {
    returnNo: string;
    purchaseNo: string;
    supplierName: string;
    warehouseId: number | string;
    reason: string;
    items: Array<{
      productId: number;
      productName?: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      reason?: string;
    }>;
    totalAmount: number;
  } = {
    returnNo: '',
    purchaseNo: '',
    supplierName: '',
    warehouseId: 1,
    reason: 'Damaged / Expired',
    items: [],
    totalAmount: 0
  };

  returns: PurchaseReturn[] = [];
  purchases: Purchase[] = [];
  warehouses: Array<{ id: number; name: string }> = [
    { id: 1, name: 'Main Warehouse' },
    { id: 2, name: 'Branch A' },
    { id: 3, name: 'Branch B' }
  ];
  medicines: Medicine[] = [];
  registeredSuppliers: Supplier[] = [];

  returnReasons: string[] = [
    'Damaged in Transit',
    'Expired Product',
    'Wrong Item Delivered',
    'Excess / Over Stock',
    'Batch Recall',
    'Quality Issue'
  ];

  get filteredReturns(): PurchaseReturn[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) return this.returns;
    return this.returns.filter(r => 
      (r.returnNo && r.returnNo.toLowerCase().includes(q)) ||
      (r.supplierName && r.supplierName.toLowerCase().includes(q)) ||
      (r.purchaseNo && r.purchaseNo.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q))
    );
  }

  constructor(
    private purchaseService: PurchaseService,
    private medicineService: MedicineService,
    private supplierService: SupplierService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startClock();
    this.initUser();
    this.loadMedicines();
    this.loadSuppliers();
    this.loadPurchases();
    this.loadReturns();
  }

  formatAmount(amount: any): string {
    const num = Number(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }


  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private initUser(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loggedInUser = user.username || user.fullName || 'ApolloAdmin';
      this.userRole = user.role || 'Admin';
    }
    const store = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || localStorage.getItem('storeName');
    if (store) this.activeStoreName = store;
    const cid = localStorage.getItem('companyId');
    if (cid) this.activeStoreId = cid;
  }

  private startClock(): void {
    const updateTime = () => {
      const now = new Date();
      this.currentDateTime = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
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

  loadMedicines(): void {
    this.medicineService.getAllMedicines(this.activeStoreId).subscribe({
      next: (meds: Medicine[]) => {
        this.medicines = meds || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.medicines = [
          { id: 1, name: 'Paracetamol 500mg', purchasePrice: 15, stockQty: 100 } as any,
          { id: 2, name: 'Amoxicillin 250mg', purchasePrice: 30, stockQty: 50 } as any
        ];
        this.cdr.markForCheck();
      }
    });
  }

  loadPurchases(): void {
    this.purchaseService.getPurchases(this.activeStoreId).subscribe({
      next: (data: Purchase[]) => {
        this.purchases = data || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.purchases = [];
      }
    });
  }

  loadReturns(): void {
    this.loading = true;
    this.purchaseService.getPurchaseReturns(this.activeStoreId).subscribe({
      next: (data: PurchaseReturn[]) => {
        this.returns = data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Failed to load purchase returns:', err);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers(this.activeStoreId).subscribe({
      next: (data: Supplier[]) => {
        this.registeredSuppliers = data || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.registeredSuppliers = [];
      }
    });
  }

  // Sidebar Toggles
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  
  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

  togglePatientMenu(): void {
    const state = this.isPatientMenuOpen;
    this.closeAllMenus();
    this.isPatientMenuOpen = !state;
  }

  openPatientFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
  }

  toggleDoctorMenu(): void {
    const state = this.isDoctorMenuOpen;
    this.closeAllMenus();
    this.isDoctorMenuOpen = !state;
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
  }

  toggleUserMenu(): void {
    const state = this.isUserMenuOpen;
    this.closeAllMenus();
    this.isUserMenuOpen = !state;
  }

  openUserFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
  }

  toggleSettingsMenu(): void {
    const state = this.isSettingsMenuOpen;
    this.closeAllMenus();
    this.isSettingsMenuOpen = !state;
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
  }

  toggleSalesMenu(): void {
    const state = this.isSalesMenuOpen;
    this.closeAllMenus();
    this.isSalesMenuOpen = !state;
  }

  openSalesFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSalesMenuOpen = true;
  }

  togglePurchaseMenu(): void {
    const state = this.isPurchaseMenuOpen;
    this.closeAllMenus();
    this.isPurchaseMenuOpen = !state;
  }

  openPurchaseFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPurchaseMenuOpen = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const sidebar = document.querySelector('.sidebar') || document.querySelector('.app-sidebar');
    const toggleBtn = document.querySelector('.btn-sidebar-toggle') || document.querySelector('.toggle-btn') || document.querySelector('.sidebar-toggle-btn');
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

  // Modal actions
  openAddModal(): void {
    this.form = {
      returnNo: 'PRTN-' + Math.floor(100000 + Math.random() * 900000),
      purchaseNo: '',
      supplierName: '',
      warehouseId: 1,
      reason: 'Damaged in Transit',
      items: [],
      totalAmount: 0
    };
    this.addItem();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onPurchaseSelect(): void {
    if (!this.form.purchaseNo) return;
    const selectedPurchase = this.purchases.find(p => p.purchaseNo === this.form.purchaseNo);
    if (selectedPurchase) {
      this.form.supplierName = selectedPurchase.supplierName || this.form.supplierName;
      if (selectedPurchase.warehouseId) {
        this.form.warehouseId = selectedPurchase.warehouseId;
      }
    }
  }

  addItem(): void {
    this.form.items.push({
      productId: 0,
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      reason: 'Damaged in Transit'
    });
    this.calculateTotal();
  }

  removeItem(index: number): void {
    this.form.items.splice(index, 1);
    this.calculateTotal();
  }

  onMedicineChange(item: any, index: number): void {
    const med = this.medicines.find((m) => m.id == item.productId);
    if (med) {
      item.productName = med.name;
      item.unitPrice = (med as any).purchasePrice || med.unitPrice || 0;
    }
    this.calculateTotal();
  }

  calculateTotal(): void {
    let total = 0;
    for (const item of this.form.items) {
      item.subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      total += item.subtotal;
    }
    this.form.totalAmount = total;
  }

  saveReturn(): void {
    if (!this.form.supplierName || this.form.items.length === 0) {
      alert('Please enter Supplier Name and add at least one item to return.');
      return;
    }

    const hasInvalidItem = this.form.items.some((it) => !it.productId || it.productId === 0 || it.quantity <= 0);
    if (hasInvalidItem) {
      alert('Please select a valid product and enter a return quantity > 0 for all rows.');
      return;
    }

    this.saving = true;
    const wh = this.warehouses.find(w => w.id == this.form.warehouseId);
    const returnPayload: PurchaseReturn = {
      ...this.form,
      warehouseName: wh ? wh.name : 'Main Warehouse',
      companyId: this.activeStoreId,
      returnDate: new Date().toISOString(),
      status: 'Returned'
    };

    this.purchaseService.createPurchaseReturn(returnPayload).subscribe({
      next: (created: PurchaseReturn) => {
        this.saving = false;
        this.closeModal();
        this.loadReturns();
        this.loadMedicines(); // Stock deduction
      },
      error: (err: any) => {
        this.saving = false;
        console.error('Failed to save purchase return:', err);
        // Optimistic fallback
        this.returns.unshift({
          ...returnPayload,
          id: Date.now()
        });
        this.closeModal();
      }
    });
  }
}
