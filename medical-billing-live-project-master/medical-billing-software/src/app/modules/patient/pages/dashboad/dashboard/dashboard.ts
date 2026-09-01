import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { PatientService, Patient } from '../../../../services/patient.service';
import { AuthService, SignupRequest } from '../../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {

  // =====================================================
  // LOADING & STATE
  // =====================================================
  loading = true;
  errorMessage = '';
  currentDateTime = '';
  private clockSubscription?: ReturnType<typeof setInterval>;

  // =====================================================
  // SIDEBAR NAVIGATION STATE
  // =====================================================
  isSidebarCollapsed = false;
  isPatientMenuOpen = true;
  isUserMenuOpen = true;

  // =====================================================
  // STORE CONTEXT & LOGGED-IN USER
  // =====================================================
  activeStoreName = 'Apollo';
  activeStoreId = '6';
  loggedInUser = 'Administrator';
  userRole = 'ADMIN';

  // =====================================================
  // LIVE DATABASE PATIENT DATA
  // =====================================================
  patients: Patient[] = [];
  drafts: Patient[] = [];
  recentPatients: Patient[] = [];

  // Patient Metrics
  totalPatientsCount = 0;
  todayPatientsCount = 0;
  insuredPatientsCount = 0;
  insuredPercentage = 0;
  activePatientsCount = 0;
  draftsCount = 0;

  // Demographics
  genderDistribution = {
    male: 0,
    female: 0,
    other: 0
  };

  bloodGroupCounts: { [key: string]: number } = {};
  topCities: { name: string; count: number }[] = [];

  // =====================================================
  // LIVE DATABASE USERS & STAFF DATA
  // =====================================================
  users: SignupRequest[] = [];
  recentUsers: SignupRequest[] = [];

  // Staff Metrics
  totalUsersCount = 0;
  activeUsersCount = 0;
  adminCount = 0;
  pharmacistCount = 0;
  billingCount = 0;
  doctorCount = 0;
  receptionistCount = 0;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initStoreContext();
    this.updateClock();
    this.clockSubscription = setInterval(() => this.updateClock(), 1000);
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.clockSubscription) {
      clearInterval(this.clockSubscription);
    }
  }

  private initStoreContext(): void {
    this.loggedInUser = this.authService.getUserName() || 'Administrator';
    this.userRole = (this.authService.getRole() || 'ADMIN').toUpperCase();
    this.activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
    this.activeStoreId = localStorage.getItem('companyId') || '6';
  }

  private updateClock(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    this.currentDateTime = now.toLocaleString('en-IN', options);
  }

  // =====================================================
  // LOAD LIVE DASHBOARD DATA (USERS & PATIENTS)
  // =====================================================
  loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    // 1. Fetch Patients from MySQL Database
    this.patientService.getAllPatients().pipe(
      catchError((err) => {
        console.error('Failed to load live patients from DB:', err);
        return of([] as Patient[]);
      })
    ).subscribe({
      next: (data: Patient[]) => {
        this.patients = Array.isArray(data) ? data : [];
        this.calculatePatientMetrics();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching patients:', err);
        this.patients = [];
        this.calculatePatientMetrics();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Fetch Users / Staff from MySQL Database
    this.authService.getAllUsers().pipe(
      catchError((err) => {
        console.error('Failed to load live users from DB:', err);
        return of([] as SignupRequest[]);
      })
    ).subscribe({
      next: (userData: SignupRequest[]) => {
        const rawUsers = Array.isArray(userData) ? userData : [];
        const currentCompanyId = localStorage.getItem('companyId');
        const currentCompanyName = (localStorage.getItem('companyName') || '').trim().toLowerCase();
        const currentRole = (localStorage.getItem('role') || '').trim().toUpperCase();
        const isSuperAdmin = currentRole.includes('SUPER_ADMIN') || currentRole.includes('SUPERADMIN');

        // Filter users strictly by company if not Super Admin
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

        this.calculateUserMetrics();
        this.cdr.detectChanges();
      },
      error: () => {
        this.users = [];
        this.calculateUserMetrics();
        this.cdr.detectChanges();
      }
    });

    // 3. Fetch Draft Patients
    this.patientService.getDraftPatients().pipe(
      catchError(() => of([] as Patient[]))
    ).subscribe({
      next: (draftData: Patient[]) => {
        this.drafts = Array.isArray(draftData) ? draftData : [];
        this.draftsCount = this.drafts.length;
        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // CALCULATE LIVE PATIENT METRICS
  // =====================================================
  private calculatePatientMetrics(): void {
    this.totalPatientsCount = this.patients.length;

    const todayStr = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    let insuredCount = 0;
    let activeCount = 0;
    let male = 0;
    let female = 0;
    let other = 0;

    const bgMap: { [key: string]: number } = {
      'O+': 0, 'A+': 0, 'B+': 0, 'AB+': 0,
      'O-': 0, 'A-': 0, 'B-': 0, 'AB-': 0
    };

    const cityMap: { [key: string]: number } = {};

    this.patients.forEach((p: Patient) => {
      // Today registration
      if (p.createdDate && p.createdDate.startsWith(todayStr)) {
        todayCount++;
      }

      // Insurance
      if (p.insuranceProvider && p.insuranceProvider.trim().length > 0) {
        insuredCount++;
      }

      // Active
      if (!p.status || p.status.toLowerCase().trim() === 'approved' || p.status.toLowerCase().trim() === 'active') {
        activeCount++;
      }

      // Gender
      const gender = (p.gender || '').toLowerCase().trim();
      if (gender === 'male' || gender === 'm') {
        male++;
      } else if (gender === 'female' || gender === 'f') {
        female++;
      } else {
        other++;
      }

      // Blood Group
      if (p.bloodGroup) {
        const bg = p.bloodGroup.toUpperCase().trim();
        bgMap[bg] = (bgMap[bg] || 0) + 1;
      }

      // City
      if (p.city && p.city.trim().length > 0) {
        const c = p.city.trim();
        cityMap[c] = (cityMap[c] || 0) + 1;
      }
    });

    this.todayPatientsCount = todayCount;
    this.insuredPatientsCount = insuredCount;
    this.insuredPercentage = this.totalPatientsCount > 0 ? Math.round((insuredCount / this.totalPatientsCount) * 100) : 0;
    this.activePatientsCount = activeCount;
    this.genderDistribution = { male, female, other };
    this.bloodGroupCounts = bgMap;

    // Top Cities
    this.topCities = Object.keys(cityMap)
      .map(k => ({ name: k, count: cityMap[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent 5 Patients from DB
    this.recentPatients = [...this.patients]
      .sort((a, b) => {
        const dateA = a.createdDate ? new Date(a.createdDate).getTime() : (a.id || 0);
        const dateB = b.createdDate ? new Date(b.createdDate).getTime() : (b.id || 0);
        return Number(dateB) - Number(dateA);
      })
      .slice(0, 5);
  }

  // =====================================================
  // CALCULATE LIVE USER / STAFF METRICS
  // =====================================================
  private calculateUserMetrics(): void {
    this.totalUsersCount = this.users.length;
    this.adminCount = this.users.filter(u => (u.role || '').toUpperCase() === 'ADMIN').length;
    this.pharmacistCount = this.users.filter(u => (u.role || '').toUpperCase() === 'PHARMACIST').length;
    this.billingCount = this.users.filter(u => (u.role || '').toUpperCase() === 'BILLING_OFFICER').length;
    this.doctorCount = this.users.filter(u => (u.role || '').toUpperCase() === 'DOCTOR').length;
    this.receptionistCount = this.users.filter(u => (u.role || '').toUpperCase() === 'RECEPTIONIST').length;
    this.activeUsersCount = this.users.filter(u => u.active !== false && (u.status || '').toLowerCase() !== 'inactive').length;
    
    // Recent 5 Staff from DB
    this.recentUsers = [...this.users].slice(0, 5);
  }

  // =====================================================
  // ROLE HELPERS
  // =====================================================
  getRoleBadgeLabel(role?: string): string {
    switch ((role || '').toUpperCase()) {
      case 'ADMIN': return 'Administrator';
      case 'PHARMACIST': return 'Pharmacist';
      case 'BILLING_OFFICER': return 'Billing Officer';
      case 'DOCTOR': return 'Doctor / Physician';
      case 'RECEPTIONIST': return 'Receptionist';
      default: return role || 'Staff';
    }
  }

  getRoleBadgeClass(role?: string): string {
    switch ((role || '').toUpperCase()) {
      case 'ADMIN': return 'badge-admin';
      case 'PHARMACIST': return 'badge-pharmacist';
      case 'BILLING_OFFICER': return 'badge-billing';
      case 'DOCTOR': return 'badge-doctor';
      case 'RECEPTIONIST': return 'badge-receptionist';
      default: return 'badge-default';
    }
  }

  // =====================================================
  // SIDEBAR TOGGLES
  // =====================================================
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  togglePatientMenu(): void {
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  scrollToAnalysis(): void {
    const el = document.getElementById('patient-demographics-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // =====================================================
  // ACTIONS & NAVIGATION
  // =====================================================
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  viewPatient(patient: Patient): void {
    this.router.navigate(['/patient-details'], { state: { patient } });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}