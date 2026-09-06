import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TaxService, TaxConfiguration, TaxCalculationResult } from '../../../services/tax.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './tax-settings.html',
  styleUrl: './tax-settings.css'
})
export class TaxSettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;

  // Permissions
  canUpdateTax = true;
  canDeleteTax = true;

  // Layout & Navigation State matching Dashboard (Sidebar closed by default, active submenu open)
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = true; // Submenu stays open so when sidebar expands user sees Tax / Category / Store Config
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

  // Taxes State (Direct from MySQL table tax_configurations)
  taxes: TaxConfiguration[] = [];
  loading = false;
  searchQuery = '';
  filterType: 'ALL' | 'EXCLUSIVE' | 'INCLUSIVE' = 'ALL';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  // Live Backend Tax Calculator State (Inclusive vs Exclusive tester)
  showCalculator = false;
  calcAmount = 112;
  calcQty = 1;
  calcDiscountPct = 0;
  calcGstRate = 12;
  calcType: 'EXCLUSIVE' | 'INCLUSIVE' = 'INCLUSIVE';
  calcResult: TaxCalculationResult | null = null;
  calcLoading = false;

  // Add / Edit Modal State
  showModal = false;
  isEditing = false;
  saving = false;
  currentTaxId: number | null = null;

  taxForm: TaxConfiguration = {
    taxName: '',
    gstRate: 12,
    cgstRate: 6,
    sgstRate: 6,
    taxType: 'EXCLUSIVE',
    status: 'ACTIVE',
    description: '',
    isDefault: false
  };

  toastMessage = '';

  constructor(
    private authService: AuthService,
    private taxService: TaxService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canUpdateTax = this.accessService.canUpdate('TAX_SETTINGS');
    this.canDeleteTax = this.accessService.canDelete('TAX_SETTINGS');
    this.accessService.permissions$.subscribe(() => {
      this.canUpdateTax = this.accessService.canUpdate('TAX_SETTINGS');
      this.canDeleteTax = this.accessService.canDelete('TAX_SETTINGS');
      this.cdr.detectChanges();
    });

    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadTaxes();
    this.runLiveCalculation();
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

  // Sidebar Controls
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isSettingsMenuOpen = true;
    }
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  openPatientFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
    this.cdr.detectChanges();
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
  }

  openUserFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  togglePatientMenu(): void {
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
  }

  toggleDoctorMenu(): void {
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // ==========================================
  // LOAD TAXES FROM MYSQL DATABASE
  // ==========================================
  loadTaxes(): void {
    this.loading = true;
    this.taxService.getAllTaxes(this.activeStoreId).subscribe({
      next: (data) => {
        this.taxes = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading taxes:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // RUN LIVE BACKEND TAX CALCULATION (INCLUSIVE / EXCLUSIVE)
  // ==========================================
  runLiveCalculation(): void {
    this.calcLoading = true;
    this.taxService.calculateItemTax({
      amount: this.calcAmount || 0,
      quantity: this.calcQty || 1,
      discountPercent: this.calcDiscountPct || 0,
      gstRate: this.calcGstRate || 0,
      taxType: this.calcType
    }).subscribe({
      next: (res) => {
        this.calcResult = res;
        this.calcLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Live calculation error:', err);
        this.calcLoading = false;
      }
    });
  }

  // Calculated rate breakdown
  onGstRateChange(): void {
    const rate = this.taxForm.gstRate || 0;
    this.taxForm.cgstRate = Math.round((rate / 2) * 100) / 100;
    this.taxForm.sgstRate = Math.round((rate / 2) * 100) / 100;
  }

  // ==========================================
  // ADD & EDIT MODAL CONTROLS
  // ==========================================
  openAddModal(): void {
    this.isEditing = false;
    this.currentTaxId = null;
    this.taxForm = {
      taxName: '',
      gstRate: 12,
      cgstRate: 6,
      sgstRate: 6,
      taxType: 'EXCLUSIVE',
      status: 'ACTIVE',
      description: '',
      isDefault: false
    };
    this.showModal = true;
  }

  openEditModal(tax: TaxConfiguration): void {
    if (!this.canUpdateTax) {
      alert('Permission Denied: Update permission required.');
      return;
    }

    this.isEditing = true;
    this.currentTaxId = tax.id || null;
    this.taxForm = {
      taxName: tax.taxName,
      gstRate: tax.gstRate,
      cgstRate: tax.cgstRate || tax.gstRate / 2,
      sgstRate: tax.sgstRate || tax.gstRate / 2,
      taxType: tax.taxType || 'EXCLUSIVE',
      status: tax.status || 'ACTIVE',
      description: tax.description || '',
      isDefault: !!tax.isDefault
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentTaxId = null;
  }

  // Save or update in MySQL Database
  saveTax(): void {
    if (this.taxForm.gstRate === null || this.taxForm.gstRate === undefined || this.taxForm.gstRate < 0) {
      alert('Please enter a valid GST Percentage (0 or higher).');
      return;
    }

    if (!this.taxForm.taxName.trim()) {
      this.taxForm.taxName = `GST ${this.taxForm.gstRate}% - ${this.taxForm.taxType === 'INCLUSIVE' ? 'Inclusive' : 'Standard'}`;
    }

    this.saving = true;

    if (this.isEditing && this.currentTaxId) {
      this.taxService.updateTax(this.currentTaxId, this.taxForm).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('Tax configuration updated successfully in MySQL!');
          this.loadTaxes();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error updating tax:', err);
          alert('Failed to update tax in database.');
        }
      });
    } else {
      this.taxService.createTax(this.taxForm, this.activeStoreId).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('New GST Tax Bracket saved successfully to MySQL!');
          this.loadTaxes();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error creating tax:', err);
          alert('Failed to save tax to database.');
        }
      });
    }
  }

  // Toggle active/inactive status directly
  toggleStatus(tax: TaxConfiguration): void {
    if (!tax.id) return;
    const newStatus = tax.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = { ...tax, status: newStatus as 'ACTIVE' | 'INACTIVE' };

    this.taxService.updateTax(tax.id, updated).subscribe({
      next: () => {
        tax.status = newStatus;
        this.showToast(`GST Tax ${tax.taxName} marked as ${newStatus}!`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to toggle status:', err);
      }
    });
  }

  // Delete tax bracket from MySQL
  deleteTax(tax: TaxConfiguration): void {
    if (!this.canDeleteTax) {
      alert('Permission Denied: Delete permission required.');
      return;
    }

    if (!tax.id) return;
    if (confirm(`Are you sure you want to delete "${tax.taxName}" (${tax.gstRate}%)?`)) {
      this.taxService.deleteTax(tax.id).subscribe({
        next: () => {
          this.showToast('Tax configuration deleted successfully from MySQL!');
          this.loadTaxes();
        },
        error: (err) => {
          console.error('Error deleting tax:', err);
          alert('Failed to delete tax configuration from database.');
        }
      });
    }
  }

  // Filtered view
  get filteredTaxes(): TaxConfiguration[] {
    return this.taxes.filter(t => {
      const matchesSearch = !this.searchQuery || 
        t.taxName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        t.gstRate.toString().includes(this.searchQuery);
      
      const matchesType = this.filterType === 'ALL' || t.taxType === this.filterType;
      const matchesStatus = this.filterStatus === 'ALL' || t.status === this.filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3200);
  }
}

