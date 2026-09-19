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
  isSidebarCollapsed = true;
  isPatientMenuOpen = false; // Auto-expanded on Patient Hub
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
