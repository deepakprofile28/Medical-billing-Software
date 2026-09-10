import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DoctorService, Doctor } from '../../../services/doctor.service';
import { AccessService } from '../../../services/access.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctor-list.html',
  styleUrls: ['./doctor-list.css']
})
export class DoctorList implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  loading = false;

  // Search & Filters
  searchQuery = '';
  selectedSpecialization = 'ALL';
  selectedStatus = 'ALL';
  specializationList: string[] = [];

  // Metrics
  totalDoctorsCount = 0;
  activeDoctorsCount = 0;
  departmentsCount = 0;

  // Delete Modal
  showDeleteModal = false;
  deletingDoctor: Doctor | null = null;
  isDeleting = false;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';
  showToast = false;

  // Sidebar Layout
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = true;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  loggedInUser = localStorage.getItem('userName') || 'Admin';
  userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || 'ADMIN').toUpperCase();
  activeStoreName = localStorage.getItem('companyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';
  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // Granular Access Permissions
  canReadDoctor = true;
  canWriteDoctor = true;
  canUpdateDoctor = true;
  canDeleteDoctor = true;

  constructor(
    private doctorService: DoctorService,
    private accessService: AccessService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);

    this.canReadDoctor = this.accessService.canRead('DOCTORS');
    this.canWriteDoctor = this.accessService.canWrite('DOCTORS');
    this.canUpdateDoctor = this.accessService.canUpdate('DOCTORS');
    this.canDeleteDoctor = this.accessService.canDelete('DOCTORS');

    this.accessService.permissions$.subscribe(() => {
      this.canReadDoctor = this.accessService.canRead('DOCTORS');
      this.canWriteDoctor = this.accessService.canWrite('DOCTORS');
      this.canUpdateDoctor = this.accessService.canUpdate('DOCTORS');
      this.canDeleteDoctor = this.accessService.canDelete('DOCTORS');
      this.cdr.detectChanges();
    });

    this.loadDoctors();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
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

  loadDoctors(): void {
    this.loading = true;
    this.doctorService.getAllDoctors(this.activeStoreId).subscribe({
      next: (data) => {
        this.doctors = data || [];
        this.extractSpecializations();
        this.applyFilter();
        this.calculateMetrics();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load doctors from database:', err);
        this.loading = false;
        this.triggerToast('Failed to load doctors from database.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  extractSpecializations(): void {
    const specs = new Set<string>();
    this.doctors.forEach(d => {
      if (d.specialization && d.specialization.trim()) {
        specs.add(d.specialization.trim());
      }
    });
    this.specializationList = Array.from(specs).sort();
  }

  calculateMetrics(): void {
    this.totalDoctorsCount = this.doctors.length;
    this.activeDoctorsCount = this.doctors.filter(d => !d.status || d.status.toUpperCase() === 'ACTIVE').length;
    this.departmentsCount = this.specializationList.length;
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredDoctors = this.doctors.filter(doc => {
      const matchesSearch = !q ||
        (doc.name && doc.name.toLowerCase().includes(q)) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(q)) ||
        (doc.phone && doc.phone.includes(q)) ||
        (doc.registrationNumber && doc.registrationNumber.toLowerCase().includes(q)) ||
        (doc.department && doc.department.toLowerCase().includes(q));

      const matchesSpec = this.selectedSpecialization === 'ALL' ||
        (doc.specialization && doc.specialization.toLowerCase() === this.selectedSpecialization.toLowerCase());

      const docStatus = (doc.status || 'ACTIVE').toUpperCase();
      const matchesStatus = this.selectedStatus === 'ALL' || docStatus === this.selectedStatus;

      return matchesSearch && matchesSpec && matchesStatus;
    });
  }

  editDoctor(doctor: Doctor): void {
    if (!this.canUpdateDoctor) {
      this.triggerToast('Permission Denied: Update permission required.', 'danger');
      return;
    }
    if (doctor.id) {
      this.router.navigate(['/edit-doctor', doctor.id]);
    }
  }

  navigateToAddDoctor(): void {
    if (!this.canWriteDoctor) {
      this.triggerToast('Permission Denied: Write permission required.', 'danger');
      return;
    }
    this.router.navigate(['/add-doctor']);
  }

  confirmDelete(doctor: Doctor): void {
    if (!this.canDeleteDoctor) {
      this.triggerToast('Permission Denied: Delete permission required.', 'danger');
      return;
    }
    this.deletingDoctor = doctor;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingDoctor = null;
    this.isDeleting = false;
  }

  executeDelete(): void {
    if (!this.deletingDoctor || !this.deletingDoctor.id) {
      return;
    }

    this.isDeleting = true;
    const docId = this.deletingDoctor.id;
    const docName = this.deletingDoctor.name;

    this.doctorService.deleteDoctor(docId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.triggerToast(`Doctor "${docName}" removed from database.`, 'success');
        this.loadDoctors();
      },
      error: (err) => {
        console.error('Failed to delete doctor:', err);
        this.isDeleting = false;
        this.triggerToast('Failed to delete doctor profile.', 'danger');
      }
    });
  }

  triggerToast(msg: string, type: 'success' | 'danger' | 'info' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3500);
  }

  // Sidebar Toggles
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isDoctorMenuOpen = true;
    }
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
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

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  toggleDoctorMenu(): void {
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
  }

  
  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
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
