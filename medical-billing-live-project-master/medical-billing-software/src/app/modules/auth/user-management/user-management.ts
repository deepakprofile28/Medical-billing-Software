import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SignupRequest } from '../../services/auth.service';
import { RoleService, Role } from '../../services/role.service';
import { AccessService } from '../../services/access.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {

  // Permissions
  canReadUser = true;
  canWriteUser = true;
  canUpdateUser = true;
  canDeleteUser = true;

  users: SignupRequest[] = [];
  filteredUsers: SignupRequest[] = [];
  searchTerm = '';
  selectedRole = 'ALL';

  // Metrics
  totalUsers = 0;
  adminCount = 0;
  billingCount = 0;
  doctorCount = 0;

  // Edit Modal State
  showEditModal = false;
  editingUserEmail = '';
  editForm!: FormGroup;

  // Reset Password Modal State
  showResetModal = false;
  resetUserEmail = '';
  resetUserName = '';
  newPassword = '';
  confirmPassword = '';
  hideNewPassword = true;
  hideConfirmPassword = true;
  resetError = '';

  // ==========================================
  // SIDEBAR NAVIGATION & LAYOUT STATE
  // ==========================================
  isSidebarCollapsed = true;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = true; // Auto-expanded on Staff Directory
  isSettingsMenuOpen = false;

  loggedInUser = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Deepak Raj';
  userRole = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'PHARMACIST').toUpperCase();
  activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';
  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isUserMenuOpen = true;
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

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // Toast / Feedback
  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';
  showToast = false;

  // Dynamic roles loaded directly from MySQL table 'roles'
  rolesList: { value: string; label: string }[] = [];
  loadingRoles = false;

  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private accessService: AccessService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canReadUser = this.accessService.canRead('USER_MANAGEMENT');
    this.canWriteUser = this.accessService.canWrite('USER_MANAGEMENT');
    this.canUpdateUser = this.accessService.canUpdate('USER_MANAGEMENT');
    this.canDeleteUser = this.accessService.canDelete('USER_MANAGEMENT');

    this.accessService.permissions$.subscribe(() => {
      this.canReadUser = this.accessService.canRead('USER_MANAGEMENT');
      this.canWriteUser = this.accessService.canWrite('USER_MANAGEMENT');
      this.canUpdateUser = this.accessService.canUpdate('USER_MANAGEMENT');
      this.canDeleteUser = this.accessService.canDelete('USER_MANAGEMENT');
      this.cdr.detectChanges();
    });

    this.initEditForm();
    this.loadDbRoles();
    this.loadUsers();
  }

  private initEditForm(): void {
    this.editForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      status: ['Active', [Validators.required]]
    });
  }

  loadDbRoles(callback?: () => void): void {
    this.loadingRoles = true;
    this.roleService.getAllRoles(this.activeStoreId, false).subscribe({
      next: (roles: Role[]) => {
        this.loadingRoles = false;
        if (roles && roles.length > 0) {
          this.rolesList = roles
            .filter(r => !r.status || r.status.toUpperCase() === 'ACTIVE')
            .map(r => {
              const name = (r.roleName || '').trim();
              const desig = (r.designation || '').trim();
              const label = desig && desig.toLowerCase() !== name.toLowerCase()
                ? `${name} (${desig})`
                : name;
              return {
                value: name,
                label: label
              };
            });
        } else {
          this.rolesList = [];
        }
        this.cdr.detectChanges();
        if (callback) {
          callback();
        }
      },
      error: (err) => {
        this.loadingRoles = false;
        console.error('Error loading roles from MySQL:', err);
        if (callback) {
          callback();
        }
      }
    });
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe((data: SignupRequest[]) => {
      const rawUsers = Array.isArray(data) ? data : [];
      const currentCompanyId = localStorage.getItem('companyId');
      const currentCompanyName = (localStorage.getItem('companyName') || '').trim().toLowerCase();
      const currentRole = (localStorage.getItem('role') || '').trim().toUpperCase();
      const isSuperAdmin = currentRole.includes('SUPER_ADMIN') || currentRole.includes('SUPERADMIN');

      this.users = rawUsers.filter(u => {
        const email = (u.email || '').toLowerCase().trim();
        const role = (u.role || '').toUpperCase().trim();
        if (email === 'admin@gmail.com' || role === 'SUPER_ADMIN' || role === 'SUPERADMIN') {
          return false;
        }

        if (!isSuperAdmin) {
          if (currentCompanyId && u.companyId !== undefined && u.companyId !== null) {
            if (String(u.companyId) !== String(currentCompanyId)) {
              return false;
            }
          } else if (currentCompanyName && u.companyName) {
            if (u.companyName.trim().toLowerCase() !== currentCompanyName) {
              return false;
            }
          }
        }

        return true;
      });

      this.applyFilter();
      this.calculateMetrics();
      this.cdr.detectChanges();
    });
  }

  calculateMetrics(): void {
    this.totalUsers = this.users.length;
    this.adminCount = this.users.filter(u => (u.role || '').toUpperCase().includes('ADMIN')).length;
    this.billingCount = this.users.filter(u => (u.role || '').toUpperCase().includes('BILLING')).length;
    this.doctorCount = this.users.filter(u => (u.role || '').toUpperCase().includes('DOCTOR')).length;
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        !term ||
        (user.userName && user.userName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.mobile && user.mobile.includes(term)) ||
        (user.companyName && user.companyName.toLowerCase().includes(term));

      const userRoleLower = (user.role || '').toLowerCase().trim();
      const matchesRole =
        this.selectedRole === 'ALL' || userRoleLower === this.selectedRole.toLowerCase().trim();

      return matchesSearch && matchesRole;
    });
  }

  getRoleBadgeLabel(role?: string): string {
    if (!role) return 'Staff';
    const trimmed = role.trim().toLowerCase();
    const found = this.rolesList.find(r => r.value.trim().toLowerCase() === trimmed);
    return found ? found.label : role.trim();
  }

  getRoleBadgeClass(role?: string): string {
    const r = (role || '').trim().toUpperCase();
    if (r.includes('ADMIN')) return 'role-admin';
    if (r.includes('BILLING')) return 'role-billing';
    if (r.includes('DOCTOR') || r.includes('PHYSICIAN')) return 'role-doctor';
    if (r.includes('RECEPTION')) return 'role-receptionist';
    if (r.includes('PHARMAC')) return 'role-pharmacist';
    return 'role-default';
  }

  // ================= EDIT MODAL =================
  openEditModal(user: SignupRequest): void {
    if (!this.canUpdateUser) {
      this.triggerToast('Permission Denied: Update permission required to edit staff profiles.', 'danger');
      return;
    }

    this.editingUserEmail = user.email;

    const populateForm = () => {
      const currentRole = (user.role || '').trim();
      const matchedRole = this.rolesList.find(
        r => r.value.toLowerCase() === currentRole.toLowerCase()
      );
      const selectedRoleValue = matchedRole 
        ? matchedRole.value 
        : (this.rolesList.length > 0 ? this.rolesList[0].value : currentRole);

      this.editForm.patchValue({
        userName: user.userName || user.name || '',
        mobile: user.mobile || '',
        role: selectedRoleValue,
        companyName: user.companyName || 'MediCare Hospital',
        status: user.status || 'Active'
      });
      this.showEditModal = true;
      this.cdr.detectChanges();
    };

    if (this.rolesList.length > 0) {
      populateForm();
      this.loadDbRoles();
    } else {
      this.loadDbRoles(() => populateForm());
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUserEmail = '';
    this.editForm.reset();
  }

  saveUserEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const val = this.editForm.value;
    const targetEmail = this.editingUserEmail;
    this.authService.updateUser(targetEmail, val).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.triggerToast(`User "${val.userName}" updated successfully!`, 'success');
          this.closeEditModal();
          this.loadUsers();

          // If the edited user is currently logged in, sync active permissions immediately
          const currentEmail = (localStorage.getItem('userEmail') || localStorage.getItem('email') || '').toLowerCase().trim();
          const currentName = (localStorage.getItem('userName') || '').toLowerCase().trim();
          if (targetEmail.toLowerCase().trim() === currentEmail || (val.userName && val.userName.toLowerCase().trim() === currentName)) {
            localStorage.setItem('role', val.role);
            localStorage.setItem('userRole', val.role);
            this.accessService.syncRolePermissions(val.role, this.activeStoreId);
          }
        } else {
          this.triggerToast('Failed to update user.', 'danger');
        }
      }
    });
  }

  // ================= RESET PASSWORD MODAL =================
  openResetModal(user: SignupRequest): void {
    this.resetUserEmail = user.email;
    this.resetUserName = user.userName || user.name || 'User';
    this.newPassword = '';
    this.confirmPassword = '';
    this.hideNewPassword = true;
    this.hideConfirmPassword = true;
    this.resetError = '';
    this.showResetModal = true;
  }

  closeResetModal(): void {
    this.showResetModal = false;
    this.resetUserEmail = '';
    this.resetUserName = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetError = '';
  }

  submitPasswordReset(): void {
    this.resetError = '';

    if (!this.newPassword || this.newPassword.length < 6) {
      this.resetError = 'New password must be at least 6 characters long.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.resetError = 'Passwords do not match.';
      return;
    }

    this.authService.resetPassword(this.resetUserEmail, this.newPassword).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.triggerToast(`Password reset successfully for ${this.resetUserName}!`, 'success');
          this.closeResetModal();
          this.loadUsers();
        } else {
          this.resetError = 'User not found to reset password.';
        }
      }
    });
  }

  // ================= DELETE USER =================
  deleteUser(user: SignupRequest): void {
    if (!this.canDeleteUser) {
      this.triggerToast('Permission Denied: Delete permission required to remove staff accounts.', 'danger');
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete staff account "${user.userName}" (${user.email})?`);
    if (!confirmDelete) return;

    this.authService.deleteUser(user.email).subscribe({
      next: () => {
        this.triggerToast(`User "${user.userName}" deleted.`, 'success');
        this.loadUsers();
      }
    });
  }

  // ================= TOAST NOTIFICATION =================
  private triggerToast(message: string, type: 'success' | 'danger'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

