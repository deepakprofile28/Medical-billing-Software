import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SalesService, SuspendedOrder } from '../../../services/sales.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-sales-suspended',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sales-suspended.html',
  styleUrl: '../sales-common.css'
})
export class SalesSuspendedPage implements OnInit, OnDestroy {
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

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  suspendedList: SuspendedOrder[] = [];
  filteredList: SuspendedOrder[] = [];
  loading = false;
  searchQuery = '';

  showModal = false;
  isEditing = false;
  saving = false;
  currentId: number | null = null;

  form: SuspendedOrder = {
    holdNo: '',
    customerName: '',
    customerPhone: '',
    totalAmount: 0,
    holdReason: '',
    suspendedStatus: 'ON_HOLD',
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
    this.loadSuspended();
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
  }

  loadSuspended(): void {
    this.loading = true;
    this.salesService.getSuspended(this.activeStoreId).subscribe({
      next: (res) => {
        this.suspendedList = res || [];
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
      this.filteredList = [...this.suspendedList];
    } else {
      this.filteredList = this.suspendedList.filter(s =>
        s.holdNo.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (s.holdReason && s.holdReason.toLowerCase().includes(q))
      );
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentId = null;
    this.form = {
      holdNo: 'HOLD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      customerName: '',
      customerPhone: '',
      totalAmount: 0,
      holdReason: '',
      suspendedStatus: 'ON_HOLD',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(item: SuspendedOrder): void {
    this.isEditing = true;
    this.currentId = item.id || null;
    this.form = { ...item };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveSuspended(): void {
    if (!this.form.holdNo || !this.form.customerName) {
      alert('Please fill in required fields');
      return;
    }
    this.saving = true;
    if (this.isEditing && this.currentId) {
      this.salesService.updateSuspended(this.currentId, this.form).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadSuspended(); },
        error: (err) => { this.saving = false; alert('Error: ' + err.message); }
      });
    } else {
      this.salesService.createSuspended(this.form, this.activeStoreId).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadSuspended(); },
        error: (err) => { this.saving = false; alert('Error: ' + err.message); }
      });
    }
  }

  deleteSuspended(id: number): void {
    if (confirm('Are you sure you want to delete this suspended order record?')) {
      this.salesService.deleteSuspended(id).subscribe({
        next: () => this.loadSuspended(),
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

  togglePatientMenu() { this.isPatientMenuOpen = !this.isPatientMenuOpen; }
  openPatientFromCollapsed() { this.isSidebarCollapsed = false; this.isPatientMenuOpen = true; }
  
  toggleDoctorMenu() { this.isDoctorMenuOpen = !this.isDoctorMenuOpen; }
  openDoctorFromCollapsed() { this.isSidebarCollapsed = false; this.isDoctorMenuOpen = true; }
  
  toggleUserMenu() { this.isUserMenuOpen = !this.isUserMenuOpen; }
  openUserFromCollapsed() { this.isSidebarCollapsed = false; this.isUserMenuOpen = true; }
  
  toggleSettingsMenu() { this.isSettingsMenuOpen = !this.isSettingsMenuOpen; }
  openSettingsFromCollapsed() { this.isSidebarCollapsed = false; this.isSettingsMenuOpen = true; }

}

