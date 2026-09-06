import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CategoryService, Category } from '../../../services/category.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-category-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './category-settings.html',
  styleUrl: './category-settings.css'
})
export class CategorySettings implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;

  // Permissions
  canUpdateCategory = true;
  canDeleteCategory = true;

  // Layout & Navigation State matching Dashboard (Sidebar closed by default, active submenu open)
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = true; // Submenu stays open so when sidebar expands user sees Category / Tax / Store Config
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

  // Categories State (Direct from MySQL table categories)
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  loading = false;
  searchQuery = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  // Add / Edit Modal State
  showModal = false;
  isEditing = false;
  saving = false;
  currentCategoryId: number | null = null;

  categoryForm: Category = {
    name: '',
    code: '',
    description: '',
    position: 1,
    status: 'ACTIVE'
  };

  toastMessage = '';

  constructor(
    private authService: AuthService,
    private categoryService: CategoryService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canUpdateCategory = this.accessService.canUpdate('CATEGORIES');
    this.canDeleteCategory = this.accessService.canDelete('CATEGORIES');
    this.accessService.permissions$.subscribe(() => {
      this.canUpdateCategory = this.accessService.canUpdate('CATEGORIES');
      this.canDeleteCategory = this.accessService.canDelete('CATEGORIES');
      this.cdr.detectChanges();
    });

    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadCategories();
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

  openUserFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  togglePatientMenu(): void {
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
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
  // LOAD CATEGORIES FROM MYSQL DATABASE
  // ==========================================
  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAllCategories(this.activeStoreId).subscribe({
      next: (data) => {
        this.categories = Array.isArray(data) ? data : [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let list = [...this.categories];

    // Status Filter
    if (this.filterStatus !== 'ALL') {
      list = list.filter(c => c.status === this.filterStatus);
    }

    // Search query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    this.filteredCategories = list;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setFilterStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  // ==========================================
  // ADD & EDIT MODAL HANDLERS
  // ==========================================
  openAddModal(): void {
    this.isEditing = false;
    this.currentCategoryId = null;
    const nextPos = this.categories.length + 1;
    this.categoryForm = {
      name: '',
      code: '',
      description: '',
      position: nextPos,
      status: 'ACTIVE'
    };
    this.showModal = true;
  }

  openEditModal(cat: Category): void {
    if (!this.canUpdateCategory) {
      alert('Permission Denied: Update permission required.');
      return;
    }

    this.isEditing = true;
    this.currentCategoryId = cat.id || null;
    this.categoryForm = {
      name: cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
      position: cat.position !== undefined ? cat.position : 1,
      status: cat.status || 'ACTIVE'
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  onNameChange(): void {
    if (!this.isEditing && this.categoryForm.name) {
      const clean = this.categoryForm.name.replaceAll(/[^a-zA-Z]/g, '').toUpperCase();
      this.categoryForm.code = clean.length >= 3 ? clean.substring(0, 3) : clean;
    }
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) {
      alert('Category Name is required.');
      return;
    }

    this.saving = true;
    const payload: Category = {
      name: this.categoryForm.name.trim(),
      code: (this.categoryForm.code || '').trim().toUpperCase(),
      description: (this.categoryForm.description || '').trim(),
      position: Number(this.categoryForm.position) || 1,
      status: this.categoryForm.status || 'ACTIVE',
      companyId: this.activeStoreId
    };

    if (this.isEditing && this.currentCategoryId) {
      this.categoryService.updateCategory(this.currentCategoryId, payload).subscribe({
        next: (res) => {
          this.saving = false;
          this.showModal = false;
          this.showToast(`Updated Category "${res.name}" successfully!`);
          this.loadCategories();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error updating category:', err);
          alert('Failed to update category in MySQL database.');
        }
      });
    } else {
      this.categoryService.createCategory(payload, this.activeStoreId).subscribe({
        next: (res) => {
          this.saving = false;
          this.showModal = false;
          this.showToast(`Added Category "${res.name}" to MySQL table!`);
          this.loadCategories();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error creating category:', err);
          alert('Failed to save category to MySQL database.');
        }
      });
    }
  }

  // Toggle active/inactive directly from grid row
  toggleCategoryStatus(cat: Category): void {
    if (!cat.id) return;
    const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated: Category = { ...cat, status: newStatus };

    this.categoryService.updateCategory(cat.id, updated).subscribe({
      next: () => {
        cat.status = newStatus;
        this.showToast(`Category "${cat.name}" is now ${newStatus}`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error toggling status:', err);
        alert('Failed to toggle status.');
      }
    });
  }

  deleteCategory(cat: Category): void {
    if (!this.canDeleteCategory) {
      alert('Permission Denied: Delete permission required.');
      return;
    }

    if (!cat.id) return;
    if (confirm(`Are you sure you want to delete Category "${cat.name}" (${cat.code}) from database?`)) {
      this.categoryService.deleteCategory(cat.id).subscribe({
        next: () => {
          this.showToast(`Deleted Category "${cat.name}" from database.`);
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          alert('Failed to delete category.');
        }
      });
    }
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 2800);
  }
}

