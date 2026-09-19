import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SalesService, SalesReturn } from '../../../services/sales.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-sales-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sales-returns.html',
  styleUrl: './sales-returns.css'
})
export class SalesReturnsPage implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;


  isSidebarCollapsed = true;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  returnsList: SalesReturn[] = [];
  filteredList: SalesReturn[] = [];
  loading = false;
  searchQuery = '';

  showModal = false;
  isEditing = false;
  saving = false;
  currentId: number | null = null;

  form: SalesReturn = {
    returnNo: '',
    originalBillNo: '',
    customerName: '',
    returnReason: '',
    refundAmount: 0,
    refundMethod: 'CASH',
    refundStatus: 'REFUNDED',
    status: 'ACTIVE'
  };

  constructor(
    private salesService: SalesService,
    private authService: AuthService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadUserData();
    this.loadReturns();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  private updateClock(): void {
    this.currentDateTime = new Date().toLocaleDateString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loggedInUser = user.fullName || user.username || user.email || 'Apollo';
      this.userRole = user.role || 'ADMIN';
    }
    const store = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || localStorage.getItem('storeName');
    if (store) this.activeStoreName = store;
    const cid = localStorage.getItem('companyId');
    if (cid) this.activeStoreId = cid;
  }

  loadReturns(): void {
    this.loading = true;
    this.salesService.getReturns(this.activeStoreId).subscribe({
      next: (res) => {
        this.returnsList = res || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredList = [...this.returnsList];
    } else {
      this.filteredList = this.returnsList.filter(r =>
        r.returnNo.toLowerCase().includes(q) ||
        r.originalBillNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q)
      );
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentId = null;
    this.form = {
      returnNo: 'RET-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      originalBillNo: 'INV-2026-002',
      customerName: '',
      returnReason: '',
      refundAmount: 0,
      refundMethod: 'CASH',
      refundStatus: 'REFUNDED',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(item: SalesReturn): void {
    this.isEditing = true;
    this.currentId = item.id || null;
    this.form = { ...item };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveReturn(): void {
    if (!this.form.returnNo || !this.form.customerName || !this.form.originalBillNo) {
      alert('Please fill in required fields');
      return;
    }
    this.saving = true;
    if (this.isEditing && this.currentId) {
      this.salesService.updateReturn(this.currentId, this.form).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadReturns(); },
        error: (err) => { this.saving = false; alert('Error: ' + err.message); }
      });
    } else {
      this.salesService.createReturn(this.form, this.activeStoreId).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadReturns(); },
        error: (err) => { this.saving = false; alert('Error: ' + err.message); }
      });
    }
  }

  deleteReturn(id: number): void {
    if (confirm('Are you sure you want to delete this return record?')) {
      this.salesService.deleteReturn(id).subscribe({
        next: () => this.loadReturns(),
        error: (err) => alert('Error: ' + err.message)
      });
    }
  }

  
          

  

  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }

  totalPatientsCount = 0;
  totalUsersCount = 0;

  
  

  

  
  
  
  
  
  
  
  
  
  
  

  

  


  

  


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
