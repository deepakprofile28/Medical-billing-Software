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
  isSidebarCollapsed = true;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
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
  

  

  

  

  

  

  
  

  

  

  

  

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  

  


  

  


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
