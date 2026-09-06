import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SalesService, SalesTransaction } from '../../../services/sales.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-sales-transaction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './sales-transaction.html',
  styleUrl: '../sales-common.css'
})
export class SalesTransactionPage implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;


  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = true;

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = 'Apollo Pharmacy Hub';
  activeStoreId = '1';

    draftsCount = 0;
  
  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  transactions: SalesTransaction[] = [];
  filteredTransactions: SalesTransaction[] = [];
  loading = false;
  searchQuery = '';

  showModal = false;
  isEditing = false;
  saving = false;
  currentId: number | null = null;

  form: SalesTransaction = {
    transactionNo: '',
    customerName: '',
    customerPhone: '',
    totalAmount: 0,
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
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
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loggedInUser = user.fullName || user.username || user.email || 'Apollo';
      this.userRole = user.role || 'ADMIN';
    }
    const store = localStorage.getItem('storeName');
    if (store) this.activeStoreName = store;
  }

  loadTransactions(): void {
    this.loading = true;
    this.salesService.getTransactions(this.activeStoreId).subscribe({
      next: (res) => {
        this.transactions = res || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredTransactions = [...this.transactions];
    } else {
      this.filteredTransactions = this.transactions.filter(t =>
        t.transactionNo.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        (t.customerPhone && t.customerPhone.includes(q))
      );
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentId = null;
    this.form = {
      transactionNo: 'TXN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      customerName: '',
      customerPhone: '',
      totalAmount: 0,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(item: SalesTransaction): void {
    this.isEditing = true;
    this.currentId = item.id || null;
    this.form = { ...item };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveTransaction(): void {
    if (!this.form.transactionNo || !this.form.customerName) {
      alert('Please fill in required fields (Transaction No & Customer Name)');
      return;
    }
    this.saving = true;
    if (this.isEditing && this.currentId) {
      this.salesService.updateTransaction(this.currentId, this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadTransactions();
        },
        error: (err) => {
          this.saving = false;
          alert('Error updating transaction: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.salesService.createTransaction(this.form, this.activeStoreId).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadTransactions();
        },
        error: (err) => {
          this.saving = false;
          alert('Error creating transaction: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteTransaction(id: number): void {
    if (confirm('Are you sure you want to delete this transaction record?')) {
      this.salesService.deleteTransaction(id).subscribe({
        next: () => this.loadTransactions(),
        error: (err) => alert('Error deleting record: ' + err.message)
      });
    }
  }

  toggleSidebar(): void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
          toggleSalesMenu(): void { this.isSalesMenuOpen = !this.isSalesMenuOpen; }

  openSalesFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSalesMenuOpen = true;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  totalPatientsCount = 0;
  totalUsersCount = 0;

  togglePatientMenu() { this.isPatientMenuOpen = !this.isPatientMenuOpen; }
  openPatientFromCollapsed() { this.isSidebarCollapsed = false; this.isPatientMenuOpen = true; }
  
  toggleDoctorMenu() { this.isDoctorMenuOpen = !this.isDoctorMenuOpen; }
  openDoctorFromCollapsed() { this.isSidebarCollapsed = false; this.isDoctorMenuOpen = true; }
  
  toggleUserMenu() { this.isUserMenuOpen = !this.isUserMenuOpen; }
  openUserFromCollapsed() { this.isSidebarCollapsed = false; this.isUserMenuOpen = true; }
  
  toggleSettingsMenu() { this.isSettingsMenuOpen = !this.isSettingsMenuOpen; }
  openSettingsFromCollapsed() { this.isSidebarCollapsed = false; this.isSettingsMenuOpen = true; }

}

