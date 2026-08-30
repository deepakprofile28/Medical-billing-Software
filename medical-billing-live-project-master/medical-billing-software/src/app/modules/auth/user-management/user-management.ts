import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SignupRequest } from '../../services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {

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

  // Toast / Feedback
  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';
  showToast = false;

  readonly rolesList = [
    { value: 'ADMIN', label: 'Hospital / Clinic Administrator' },
    { value: 'BILLING_OFFICER', label: 'Medical Billing Specialist' },
    { value: 'DOCTOR', label: 'Doctor / Physician' },
    { value: 'RECEPTIONIST', label: 'Front Desk / Receptionist' },
    { value: 'PHARMACIST', label: 'Pharmacy In-Charge' }
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initEditForm();
    this.loadUsers();
  }

  private initEditForm(): void {
    this.editForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['BILLING_OFFICER', [Validators.required]],
      companyName: ['', [Validators.required]],
      status: ['Active', [Validators.required]]
    });
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe((data: SignupRequest[]) => {
      this.users = Array.isArray(data) ? data : [];
      this.applyFilter();
      this.calculateMetrics();
    });
  }

  calculateMetrics(): void {
    this.totalUsers = this.users.length;
    this.adminCount = this.users.filter(u => u.role === 'ADMIN').length;
    this.billingCount = this.users.filter(u => u.role === 'BILLING_OFFICER').length;
    this.doctorCount = this.users.filter(u => u.role === 'DOCTOR').length;
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

      const matchesRole =
        this.selectedRole === 'ALL' || user.role === this.selectedRole;

      return matchesSearch && matchesRole;
    });
  }

  getRoleBadgeLabel(role?: string): string {
    const found = this.rolesList.find(r => r.value === role);
    return found ? found.label : (role || 'Staff');
  }

  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'BILLING_OFFICER': return 'role-billing';
      case 'DOCTOR': return 'role-doctor';
      case 'RECEPTIONIST': return 'role-receptionist';
      case 'PHARMACIST': return 'role-pharmacist';
      default: return 'role-default';
    }
  }

  // ================= EDIT MODAL =================
  openEditModal(user: SignupRequest): void {
    this.editingUserEmail = user.email;
    this.editForm.patchValue({
      userName: user.userName || user.name || '',
      mobile: user.mobile || '',
      role: user.role || 'BILLING_OFFICER',
      companyName: user.companyName || 'MediCare Hospital',
      status: user.status || 'Active'
    });
    this.showEditModal = true;
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
    this.authService.updateUser(this.editingUserEmail, val).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.triggerToast(`User "${val.userName}" updated successfully!`, 'success');
          this.closeEditModal();
          this.loadUsers();
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
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

