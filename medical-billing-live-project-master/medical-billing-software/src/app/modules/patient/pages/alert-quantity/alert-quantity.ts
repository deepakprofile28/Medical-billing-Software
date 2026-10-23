import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AlertQuantityService, ProductAlert, AlertSummary } from '../../../services/alert-quantity.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-alert-quantity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './alert-quantity.html',
  styleUrl: './alert-quantity.css'
})
export class AlertQuantityPage implements OnInit, OnDestroy {
  // Sidebar navigation states (Collapsed by default, matches Dashboard, POS, and Settings)
  isSidebarCollapsed = true;
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  // Header & User Info
  loggedInUser = 'Admin';
  userRole = 'Admin';
  activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';
  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // Sidebar counters
  totalPatientsCount = 0;
  draftsCount = 0;
  totalUsersCount = 0;

  // Alert Data & Summaries
  alerts: ProductAlert[] = [];
  filteredAlerts: ProductAlert[] = [];
  summary: AlertSummary = {
    totalProducts: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    adequateStockCount: 0,
    totalAlertsCount: 0,
    totalUnits: 0
  };

  loading = false;
  saving = false;

  // Filters & Sorting
  searchQuery = '';
  selectedStatusFilter: 'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ADEQUATE' = 'ALL';
  selectedCategory = 'ALL';
  categories: string[] = ['ALL'];
  sortBy: 'urgency' | 'name' | 'stock' | 'alert' = 'urgency';

  // Edit Alert Threshold Modal
  isEditModalOpen = false;
  editingProduct: ProductAlert | null = null;
  editAlertQty = 10;

  // Bulk Modal
  isBulkModalOpen = false;
  bulkCategory = 'ALL';
  bulkAlertQty = 15;

  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastVisible = false;
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private alertService: AlertQuantityService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initClock();
    this.loadUserContext();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private initClock(): void {
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
    };
    updateTime();
    this.clockTimer = setInterval(updateTime, 1000);
  }

  private loadUserContext(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loggedInUser = user.name || user.email || 'Admin';
      this.userRole = user.role || 'Admin';
    }
    const cName = this.authService.getCompanyName();
    if (cName) {
      this.activeStoreName = cName;
    }
    const cId = this.authService.getCompanyId();
    if (cId) {
      this.activeStoreId = cId.toString();
    }
  }

  loadData(): void {
    this.loading = true;
    const compId = this.activeStoreId ? Number(this.activeStoreId) : undefined;

    // Load Summary
    this.alertService.getSummary(compId).subscribe({
      next: (sum) => {
        this.summary = sum;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load alert summary:', err);
      }
    });

    // Load Alert List
    this.alertService.getAlerts(compId).subscribe({
      next: (list) => {
        this.alerts = list || [];
        this.extractCategories();
        this.applyFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load alert list:', err);
        this.loading = false;
        this.showToast('Failed to load alert quantity data.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  private extractCategories(): void {
    const catSet = new Set<string>();
    this.alerts.forEach(item => {
      if (item.category && item.category.trim()) {
        catSet.add(item.category.trim());
      }
    });
    this.categories = ['ALL', ...Array.from(catSet).sort()];
  }

  setStatusFilter(status: 'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ADEQUATE'): void {
    this.selectedStatusFilter = status;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.alerts];

    // Status filter
    if (this.selectedStatusFilter !== 'ALL') {
      result = result.filter(item => item.status === this.selectedStatusFilter);
    }

    // Category filter
    if (this.selectedCategory !== 'ALL') {
      result = result.filter(item => item.category === this.selectedCategory);
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.genericName && item.genericName.toLowerCase().includes(q)) ||
        (item.batchNo && item.batchNo.toLowerCase().includes(q)) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (this.sortBy === 'urgency') {
        const orderMap: { [key: string]: number } = { OUT_OF_STOCK: 1, LOW_STOCK: 2, ADEQUATE: 3 };
        const orderA = orderMap[a.status] || 4;
        const orderB = orderMap[b.status] || 4;
        if (orderA !== orderB) return orderA - orderB;
        return a.stockQty - b.stockQty;
      } else if (this.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (this.sortBy === 'stock') {
        return a.stockQty - b.stockQty;
      } else if (this.sortBy === 'alert') {
        return b.alertQuantity - a.alertQuantity;
      }
      return 0;
    });

    this.filteredAlerts = result;
  }

  // Edit Single Product Alert Threshold
  openEditModal(product: ProductAlert): void {
    this.editingProduct = product;
    this.editAlertQty = product.alertQuantity ?? 10;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingProduct = null;
  }

  setQuickPreset(qty: number): void {
    this.editAlertQty = qty;
  }

  saveEditThreshold(): void {
    if (!this.editingProduct) return;
    if (this.editAlertQty < 0) {
      this.showToast('Alert quantity must be 0 or greater.', 'error');
      return;
    }

    this.saving = true;
    this.alertService.updateAlertQuantity(this.editingProduct.id, this.editAlertQty).subscribe({
      next: () => {
        this.saving = false;
        this.showToast(`Alert threshold updated for ${this.editingProduct?.name}!`, 'success');
        this.closeEditModal();
        this.loadData();
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to update threshold:', err);
        this.showToast('Failed to update alert quantity.', 'error');
      }
    });
  }

  // Bulk Modal
  openBulkModal(): void {
    this.bulkCategory = 'ALL';
    this.bulkAlertQty = 15;
    this.isBulkModalOpen = true;
  }

  closeBulkModal(): void {
    this.isBulkModalOpen = false;
  }

  saveBulkThreshold(): void {
    if (this.bulkAlertQty < 0) {
      this.showToast('Alert quantity must be 0 or greater.', 'error');
      return;
    }

    this.saving = true;
    const compId = this.activeStoreId ? Number(this.activeStoreId) : undefined;
    const cat = this.bulkCategory === 'ALL' ? undefined : this.bulkCategory;

    this.alertService.bulkSetAlertQuantity(this.bulkAlertQty, compId, cat).subscribe({
      next: (resp) => {
        this.saving = false;
        this.showToast(resp.message || 'Bulk alert threshold updated successfully!', 'success');
        this.closeBulkModal();
        this.loadData();
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed bulk update:', err);
        this.showToast('Failed to update bulk alert quantity.', 'error');
      }
    });
  }

  // Navigate to purchase to restock
  reorderProduct(product: ProductAlert): void {
    // Navigate to purchase page
    this.router.navigate(['/purchase'], {
      queryParams: {
        productId: product.id,
        productName: product.name,
        suggestedQty: product.reorderQty || 20
      }
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.markForCheck();
    }, 3500);
  }

  // Navigation sidebar togglers
  toggleSidebar(e?: Event): void {
    if (e) e.stopPropagation();
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  openSalesFromCollapsed(e: Event): void {
    e.stopPropagation();
    this.isSidebarCollapsed = false;
    this.isSalesMenuOpen = true;
  }

  openPurchaseFromCollapsed(e: Event): void {
    e.stopPropagation();
    this.isSidebarCollapsed = false;
    this.isPurchaseMenuOpen = true;
  }

  openSupplierFromCollapsed(e: Event): void {
    e.stopPropagation();
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

  openPatientFromCollapsed(e: Event): void {
    e.stopPropagation();
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
  }

  openDoctorFromCollapsed(e: Event): void {
    e.stopPropagation();
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
  }

  openUserFromCollapsed(e: Event): void {
    e.stopPropagation();
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
  }

  openSettingsFromCollapsed(e: Event): void {
    e.stopPropagation();
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
  }

  togglePurchaseMenu(e: Event): void {
    e.stopPropagation();
    this.isPurchaseMenuOpen = !this.isPurchaseMenuOpen;
  }

  toggleSupplierMenu(e: Event): void {
    e.stopPropagation();
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  togglePatientMenu(e: Event): void {
    e.stopPropagation();
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
  }

  toggleDoctorMenu(e: Event): void {
    e.stopPropagation();
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
  }

  toggleSalesMenu(e: Event): void {
    e.stopPropagation();
    this.isSalesMenuOpen = !this.isSalesMenuOpen;
  }

  toggleUserMenu(e: Event): void {
    e.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSettingsMenu(e: Event): void {
    e.stopPropagation();
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
