import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SalesService, SalesExchange } from '../../../services/sales.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-sales-exchange',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sales-exchange.html',
  styleUrl: './sales-exchange.css'
})
export class SalesExchangePage implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;


  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = true;

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  exchangeList: SalesExchange[] = [];
  filteredList: SalesExchange[] = [];
  loading = false;
  searchQuery = '';

  showModal = false;
  isEditing = false;
  saving = false;
  currentId: number | null = null;

  form: SalesExchange = {
    exchangeNo: '',
    originalBillNo: '',
    customerName: '',
    returnedItem: '',
    newItem: '',
    priceDifference: 0,
    exchangeStatus: 'COMPLETED',
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
    this.loadExchanges();
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

  loadExchanges(): void {
    this.loading = true;
    this.salesService.getExchanges(this.activeStoreId).subscribe({
      next: (res) => {
        this.exchangeList = res || [];
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
      this.filteredList = [...this.exchangeList];
    } else {
      this.filteredList = this.exchangeList.filter(e =>
        e.exchangeNo.toLowerCase().includes(q) ||
        e.originalBillNo.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q)
      );
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentId = null;
    this.form = {
      exchangeNo: 'EXC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      originalBillNo: 'INV-2026-001',
      customerName: '',
      returnedItem: '',
      newItem: '',
      priceDifference: 0,
      exchangeStatus: 'COMPLETED',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(item: SalesExchange): void {
    this.isEditing = true;
    this.currentId = item.id || null;
    this.form = { ...item };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveExchange(): void {
    if (!this.form.exchangeNo || !this.form.customerName || !this.form.returnedItem || !this.form.newItem) {
      alert('Please fill in required fields');
      return;
    }
    this.saving = true;
    if (this.isEditing && this.currentId) {
      this.salesService.updateExchange(this.currentId, this.form).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadExchanges(); },
        error: (err) => { this.saving = false; alert('Error: ' + err.message); }
      });
    } else {
      this.salesService.createExchange(this.form, this.activeStoreId).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadExchanges(); },
        error: (err) => { this.saving = false; alert('Error: ' + err.message); }
      });
    }
  }

  deleteExchange(id: number): void {
    if (confirm('Are you sure you want to delete this exchange record?')) {
      this.salesService.deleteExchange(id).subscribe({
        next: () => this.loadExchanges(),
        error: (err) => alert('Error: ' + err.message)
      });
    }
  }

  toggleSidebar(): void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
          toggleSalesMenu(): void { this.isSalesMenuOpen = !this.isSalesMenuOpen; }

  openSalesFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSalesMenuOpen = true;
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }

  totalPatientsCount = 0;
  totalUsersCount = 0;

  
  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

  togglePatientMenu() { const state = this.isPatientMenuOpen; this.closeAllMenus(); this.isPatientMenuOpen = !state; }
  openPatientFromCollapsed() { this.isSidebarCollapsed = false; this.isPatientMenuOpen = true; }
  
  toggleDoctorMenu() { const state = this.isDoctorMenuOpen; this.closeAllMenus(); this.isDoctorMenuOpen = !state; }
  openDoctorFromCollapsed() { this.isSidebarCollapsed = false; this.isDoctorMenuOpen = true; }
  
  toggleUserMenu() { const state = this.isUserMenuOpen; this.closeAllMenus(); this.isUserMenuOpen = !state; }
  openUserFromCollapsed() { this.isSidebarCollapsed = false; this.isUserMenuOpen = true; }
  
  toggleSettingsMenu() { const state = this.isSettingsMenuOpen; this.closeAllMenus(); this.isSettingsMenuOpen = !state; }
  openSettingsFromCollapsed() { this.isSidebarCollapsed = false; this.isSettingsMenuOpen = true; }

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
