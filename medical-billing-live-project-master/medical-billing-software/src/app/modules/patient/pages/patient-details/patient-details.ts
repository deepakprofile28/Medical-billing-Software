import { HostListener, Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { PatientService } from '../../../services/patient.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './patient-details.html',
  styleUrl: './patient-details.css'
})
export class PatientDetails implements OnInit {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  // Permissions
  canUpdatePatient = true;

  // ==========================================
  // SIDEBAR NAVIGATION & LAYOUT STATE
  // ==========================================
  isSidebarCollapsed = false;
  isPatientMenuOpen = true; // Auto-expanded on Patient Hub
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

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
      this.isPatientMenuOpen = true;
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

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
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
      this.router.navigate(['/patients']);
    }
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.router.navigate(['/login']);
    }
  }

  // ==========================================
  // PATIENT
  // ==========================================

  patient: any = null;

  // ==========================================
  // LOADING
  // ==========================================

  loading = true;

  // ==========================================
  // PATIENT ID
  // ==========================================

  patientId: number | null = null;

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private accessService: AccessService,
    private cdr: ChangeDetectorRef
  ) {}

  // ==========================================
  // ON INIT
  // ==========================================

  ngOnInit(): void {

    console.log(
      'PatientDetails component initialized'
    );

    this.canUpdatePatient = this.accessService.canUpdate('PATIENT_LIST');
    this.accessService.permissions$.subscribe(() => {
      this.canUpdatePatient = this.accessService.canUpdate('PATIENT_LIST');
      this.cdr.detectChanges();
    });

    // Get ID from query parameter
    this.route.queryParams.subscribe(params => {

      const id = params['id'];

      console.log(
        'Patient ID from URL:',
        id
      );

      if (!id) {

        console.error(
          'Patient ID not found in URL'
        );

        this.patient = null;
        this.loading = false;

        this.cdr.detectChanges();

        return;
      }

      this.patientId = Number(id);

      this.loadPatient(
        this.patientId
      );
    });
  }

  // ==========================================
  // GET PATIENT BY ID
  // ==========================================

  loadPatient(id: number): void {

    this.loading = true;

    console.log(
      'Calling GET patient by ID API:',
      id
    );

    this.patientService
      .getPatientById(id)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (data: any) => {

          console.log(
            'Patient details API response:',
            data
          );

          this.patient = data;

          this.loading = false;

          this.cdr.detectChanges();

          console.log(
            'Patient loaded:',
            this.patient
          );
        },

        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'Failed to load patient details:',
            error
          );

          this.patient = null;

          this.loading = false;

          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // BACK TO PATIENT LIST
  // ==========================================

  backToPatients(): void {

    this.router.navigate([
      '/patients'
    ]);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  editPatient(): void {

    if (!this.canUpdatePatient) {
      alert('Permission Denied: Update permission required to edit patient records.');
      return;
    }

    if (!this.patient?.id) {

      alert(
        'Patient ID not found'
      );

      return;
    }

    console.log(
      'Editing patient:',
      this.patient.id
    );

    this.router.navigate(
      ['/patient-registration'],
      {
        queryParams: {
          id: this.patient.id
        }
      }
    );
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
