import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BranchService, Branch } from '../../../services/branch.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-branch-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './branch-settings.html',
  styleUrl: './branch-settings.css'
})
export class BranchSettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  canUpdateBranch = true;
  canDeleteBranch = true;

  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = true;
  isSalesMenuOpen = false;

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = 'Apollo Pharmacy Hub';
  activeStoreId = '1';

  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  loading = false;
  searchQuery = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  showModal = false;
  isEditing = false;
  saving = false;
  currentBranchId: number | null = null;

  branchForm: Branch = {
    name: '',
    branchCode: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    gstin: '',
    dlNumber: '',
    branchManager: '',
    status: 'ACTIVE'
  };

  toastMessage = '';

  constructor(
    private authService: AuthService,
    private branchService: BranchService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canUpdateBranch = this.accessService.canUpdate('SETTINGS');
    this.canDeleteBranch = this.accessService.canDelete('SETTINGS');
    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadBranches();
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

  private updateClock(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  toggleSidebar(): void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  
  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

  togglePatientMenu(): void { this.isPatientMenuOpen = !this.isPatientMenuOpen; }
  toggleDoctorMenu(): void { this.isDoctorMenuOpen = !this.isDoctorMenuOpen; }
  toggleUserMenu(): void { this.isUserMenuOpen = !this.isUserMenuOpen; }
  toggleSettingsMenu(): void { this.isSettingsMenuOpen = !this.isSettingsMenuOpen; }

  openPatientFromCollapsed(): void { this.isSidebarCollapsed = false; this.isPatientMenuOpen = true; }
  openDoctorFromCollapsed(): void { this.isSidebarCollapsed = false; this.isDoctorMenuOpen = true; }
  openUserFromCollapsed(): void { this.isSidebarCollapsed = false; this.isUserMenuOpen = true; }
  openSettingsFromCollapsed(): void { this.isSidebarCollapsed = false; this.isSettingsMenuOpen = true; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadBranches(): void {
    this.loading = true;
    this.branchService.getAllBranches(this.activeStoreId).subscribe({
      next: (data) => {
        this.branches = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.branches];
    if (this.filterStatus !== 'ALL') {
      result = result.filter(b => (b.status || 'ACTIVE').toUpperCase() === this.filterStatus);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.branchCode && b.branchCode.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.branchManager && b.branchManager.toLowerCase().includes(q))
      );
    }
    this.filteredBranches = result;
  }

  onSearchChange(): void { this.applyFilter(); }
  setFilterStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentBranchId = null;
    this.branchForm = {
      name: '',
      branchCode: 'BR-00' + (this.branches.length + 1),
      address: '',
      city: 'Chennai',
      phone: '',
      email: '',
      gstin: '33AABCA1234F1Z8',
      dlNumber: 'TN/CHN/20B/2026/0091',
      branchManager: '',
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(item: Branch): void {
    if (!this.canUpdateBranch) return;
    this.isEditing = true;
    this.currentBranchId = item.id || null;
    this.branchForm = { ...item };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveBranch(): void {
    if (!this.branchForm.name.trim()) {
      alert('Branch Name is required');
      return;
    }

    this.saving = true;
    if (this.isEditing && this.currentBranchId) {
      this.branchService.updateBranch(this.currentBranchId, this.branchForm).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.showToast('Branch updated successfully!');
          this.loadBranches();
        },
        error: (err) => {
          this.saving = false;
          alert('Error updating branch: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.branchService.createBranch(this.branchForm, this.activeStoreId).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.showToast('Branch created successfully!');
          this.loadBranches();
        },
        error: (err) => {
          this.saving = false;
          alert('Error creating branch: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  toggleStatus(item: Branch): void {
    if (!this.canUpdateBranch || !item.id) return;
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = { ...item, status: newStatus as 'ACTIVE' | 'INACTIVE' };
    this.branchService.updateBranch(item.id, updated).subscribe({
      next: () => {
        item.status = newStatus;
        this.showToast(`Branch status changed to ${newStatus}`);
        this.applyFilter();
      }
    });
  }

  deleteBranch(id?: number): void {
    if (!this.canDeleteBranch || !id) return;
    if (confirm('Are you sure you want to delete this branch record?')) {
      this.branchService.deleteBranch(id).subscribe({
        next: () => {
          this.showToast('Branch deleted successfully!');
          this.loadBranches();
        }
      });
    }
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = ''; }, 3500);
  }

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
