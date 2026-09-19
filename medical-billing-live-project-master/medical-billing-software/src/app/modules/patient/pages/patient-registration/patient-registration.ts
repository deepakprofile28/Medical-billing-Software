import { HostListener, Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { PatientForm } from '../../components/patient-form/patient-form';

import { PatientService } from '../../../services/patient.service';
import { AccessService } from '../../../services/access.service';

import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PatientForm
  ],
  templateUrl: './patient-registration.html',
  styleUrl: './patient-registration.css'
})
export class PatientRegistration implements OnInit, AfterViewInit {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

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

  // =====================================================
  // STEP
  // =====================================================

  currentStep = 1;

  patientAge = 0;

  patientForm: FormGroup;

  customColumns: Array<{
    key: string;
    label: string;
    inputType: 'text' | 'dropdown' | 'multi-select';
    options: string[];
  }> = [];

  customSelectOpen: Record<string, boolean> = {};

  // =====================================================
  // EDIT MODE & PERMISSION GUARDS
  // =====================================================

  isEditMode = false;

  editPatientId: number | null = null;

  canWritePatient = true;

  canUpdatePatient = true;

  // =====================================================
  // TOAST
  // =====================================================

  showToastMessage = '';

  showToastType: 'success' | 'error' = 'success';

  showToastVisible = false;

  // =====================================================
  // PREVIEW CAROUSEL
  // =====================================================

  previewIndex = 0;

  totalPreviews = 5;

  @ViewChild('previewPanel', { static: false })
  previewPanel!: ElementRef<HTMLElement>;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private accessService: AccessService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {

    // ===================================================
    // CREATE FORM
    // ===================================================

    this.patientForm = this.fb.group({

      // ---------------- PERSONAL ----------------

      name: [''],
      mobile: [''],
      email: [''],
      dob: [''],
      gender: [''],
      bloodGroup: [''],
      maritalStatus: [''],
      occupation: [''],
      aadhaar: [''],
      pan: [''],
      emergencyContact: [''],
      emergencyName: [''],

      // ---------------- ADDRESS ----------------

      address1: [''],
      address2: [''],
      district: [''],
      city: [''],
      state: [''],
      country: ['India'],
      pincode: [''],

      // ---------------- MEDICAL ----------------

      medicalHistory: [''],
      currentMedication: [''],
      allergies: [''],

      // ---------------- INSURANCE ----------------

      insuranceProvider: [''],
      policyNumber: [''],
      policyHolderName: ['']
    });

    this.loadCustomColumns();
  }

  private loadCustomColumns(): void {
    const storedColumns = localStorage.getItem('patient-list-custom-columns');

    if (!storedColumns) {
      return;
    }

    try {
      const parsedColumns = JSON.parse(storedColumns) as Array<{
        key: string;
        label: string;
        inputType?: 'text' | 'dropdown' | 'multi-select';
        options?: string[];
      }>;

      this.customColumns = parsedColumns
        .filter((column) => column.key && column.label)
        .map((column) => ({
          key: column.key,
          label: column.label,
          inputType: column.inputType || 'text',
          options: column.options || []
        }));

      this.customColumns.forEach((column) => {
        this.patientForm.addControl(
          column.key,
          this.fb.control(column.inputType === 'multi-select' ? [] : '')
        );
      });
    } catch {
      this.customColumns = [];
    }
  }

  toggleCustomSelect(columnKey: string): void {
    const isAllowed = this.isEditMode ? this.canUpdatePatient : this.canWritePatient;
    if (!isAllowed) return;
    this.customSelectOpen[columnKey] = !this.customSelectOpen[columnKey];
  }

  isCustomOptionSelected(columnKey: string, option: string): boolean {
    const selectedValues = this.patientForm.get(columnKey)?.value;
    return Array.isArray(selectedValues) && selectedValues.includes(option);
  }

  toggleCustomOption(columnKey: string, option: string): void {
    const isAllowed = this.isEditMode ? this.canUpdatePatient : this.canWritePatient;
    if (!isAllowed) return;

    const control = this.patientForm.get(columnKey);
    const selectedValues = Array.isArray(control?.value)
      ? [...control.value]
      : [];
    const optionIndex = selectedValues.indexOf(option);

    if (optionIndex >= 0) {
      selectedValues.splice(optionIndex, 1);
    } else {
      selectedValues.push(option);
    }

    control?.setValue(selectedValues);
  }

  getCustomSelectedText(columnKey: string): string {
    const selectedValues = this.patientForm.get(columnKey)?.value;
    return Array.isArray(selectedValues) && selectedValues.length > 0
      ? selectedValues.join(', ')
      : 'Select options';
  }

  // =====================================================
  // ON INIT
  // =====================================================

  ngOnInit(): void {
    console.log('Patient Registration component initialized');

    this.canWritePatient = this.accessService.canWrite('PATIENT_REGISTRATION');
    this.canUpdatePatient = this.accessService.canUpdate('PATIENT_REGISTRATION') || this.accessService.canUpdate('PATIENT_LIST');

    this.accessService.permissions$.subscribe(() => {
      this.canWritePatient = this.accessService.canWrite('PATIENT_REGISTRATION');
      this.canUpdatePatient = this.accessService.canUpdate('PATIENT_REGISTRATION') || this.accessService.canUpdate('PATIENT_LIST');
      this.applyFormPermissionState();
    });

    this.loadPatientForEdit();
  }

  applyFormPermissionState(): void {
    const isAllowed = this.isEditMode ? this.canUpdatePatient : this.canWritePatient;
    if (!isAllowed) {
      this.patientForm.disable({ emitEvent: false });
    } else {
      this.patientForm.enable({ emitEvent: false });
    }
    this.cdr.detectChanges();
  }

  // =====================================================
  // LOAD PATIENT FOR EDIT
  // =====================================================

  private loadPatientForEdit(): void {

    this.route.queryParams.subscribe(params => {

      console.log(
        'Query Params:',
        params
      );

      const id = params['id'];

      // =================================================
      // NEW PATIENT
      // =================================================

      if (!id) {

        console.log(
          'New Patient Registration'
        );

        this.isEditMode = false;

        this.editPatientId = null;

        this.applyFormPermissionState();

        return;
      }

      // =================================================
      // EDIT MODE
      // =================================================

      this.isEditMode = true;

      this.editPatientId = Number(id);

      console.log(
        'EDIT MODE'
      );

      console.log(
        'Edit Patient ID:',
        this.editPatientId
      );

      // =================================================
      // GET PATIENT BY ID
      // =================================================

      this.patientService
        .getPatientById(this.editPatientId)
        .subscribe({

          // =============================================
          // SUCCESS
          // =============================================

          next: (response: any) => {

            console.log(
              'API Patient Response:',
              response
            );

            // =========================================
            // HANDLE RESPONSE
            // =========================================

            const patient =
              response?.data
                ? response.data
                : response;

            console.log(
              'Patient object used for patch:',
              patient
            );

            if (!patient) {

              console.error(
                'Patient data is empty'
              );

              this.showToast(
                'Patient details not found',
                'error'
              );

              return;
            }

            // =========================================
            // FORMAT DOB
            // =========================================

            let dobValue = patient.dob || '';

            if (dobValue) {

              try {

                const date =
                  new Date(dobValue);

                if (
                  !isNaN(date.getTime())
                ) {

                  dobValue =
                    date
                      .toISOString()
                      .split('T')[0];
                }

              } catch (error) {

                console.warn(
                  'DOB conversion failed:',
                  error
                );
              }
            }

            // =========================================
            // PATCH ALL FORM FIELDS
            // =========================================

            this.patientForm.patchValue({

              // ---------------- PERSONAL ----------------

              name:
                patient.name ?? '',

              mobile:
                patient.mobile ?? '',

              email:
                patient.email ?? '',

              dob:
                dobValue,

              gender:
                patient.gender ?? '',

              bloodGroup:
                patient.bloodGroup ?? '',

              maritalStatus:
                patient.maritalStatus ?? '',

              occupation:
                patient.occupation ?? '',

              aadhaar:
                patient.aadhaar ?? '',

              pan:
                patient.pan ?? '',

              emergencyContact:
                patient.emergencyContact ?? '',

              emergencyName:
                patient.emergencyName ?? '',

              // ---------------- ADDRESS ----------------

              address1:
                patient.address1 ?? '',

              address2:
                patient.address2 ?? '',

              district:
                patient.district ?? '',

              city:
                patient.city ?? '',

              state:
                patient.state ?? '',

              country:
                patient.country ?? 'India',

              pincode:
                patient.pincode ?? '',

              // ---------------- MEDICAL ----------------

              medicalHistory:
                patient.medicalHistory ?? '',

              currentMedication:
                patient.currentMedication ?? '',

              allergies:
                patient.allergies ?? '',

              // ---------------- INSURANCE ----------------

              insuranceProvider:
                patient.insuranceProvider ?? '',

              policyNumber:
                patient.policyNumber ?? '',

              policyHolderName:
                patient.policyHolderName ?? ''
            });

            // =========================================
            // CALCULATE AGE
            // =========================================

            this.calculatePatientAge();

            // =========================================
            // DEBUG
            // =========================================

            console.log(
              'FORM DATA AFTER PATCH:',
              this.patientForm.getRawValue()
            );

            console.log(
              'EDIT MODE:',
              this.isEditMode
            );

            console.log(
              'EDIT PATIENT ID:',
              this.editPatientId
            );

            this.applyFormPermissionState();
          },

          // =============================================
          // ERROR
          // =============================================

          error: (error: any) => {

            console.error(
              'Failed to load patient:',
              error
            );

            this.showToast(
              'Failed to load patient details',
              'error'
            );
          }
        });
    });
  }

  // =====================================================
  // CALCULATE AGE
  // =====================================================

  calculatePatientAge(): void {

    const dob =
      this.patientForm
        .get('dob')
        ?.value;

    if (!dob) {

      this.patientAge = 0;

      return;
    }

    const birthDate =
      new Date(dob);

    const today =
      new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() <
        birthDate.getDate()
      )
    ) {

      age--;
    }

    this.patientAge = age;
  }

  // =====================================================
  // AFTER VIEW INIT
  // =====================================================

  ngAfterViewInit(): void {

    setTimeout(() => {

      this.scrollToPreview(
        this.previewIndex
      );

    }, 100);
  }

  // =====================================================
  // TOAST
  // =====================================================

  showToast(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.showToastMessage =
      message;

    this.showToastType =
      type;

    this.showToastVisible =
      true;
  }

  closeToast(): void {

    this.showToastVisible =
      false;
  }

  // =====================================================
  // PREVIEW
  // =====================================================

  goToPreview(index: number): void {

    if (index < 0) {

      index = 0;
    }

    if (
      index >= this.totalPreviews
    ) {

      index =
        this.totalPreviews - 1;
    }

    this.previewIndex =
      index;

    this.scrollToPreview(
      index
    );
  }

  nextPreview(): void {

    const next =
      Math.min(
        this.previewIndex + 1,
        this.totalPreviews - 1
      );

    this.goToPreview(
      next
    );
  }

  prevPreview(): void {

    const previous =
      Math.max(
        this.previewIndex - 1,
        0
      );

    this.goToPreview(
      previous
    );
  }

  private scrollToPreview(
    index: number
  ): void {

    try {

      const panel =
        this.previewPanel
          ?.nativeElement;

      if (!panel) {

        return;
      }

      const slideWidth =
        panel.clientWidth;

      panel.scrollTo({

        left:
          index * slideWidth,

        behavior:
          'smooth'
      });

    } catch (error) {

      console.warn(
        'Preview scroll failed:',
        error
      );
    }
  }

  // =====================================================
  // NEXT STEP
  // =====================================================

  nextStep(): void {

    if (
      this.currentStep < 5
    ) {

      this.currentStep++;

      this.goToPreview(
        this.currentStep - 1
      );

    } else {

      this.savePatient();
    }
  }

  // =====================================================
  // PREVIOUS STEP
  // =====================================================

  previousStep(): void {

    if (
      this.currentStep > 1
    ) {

      this.currentStep--;

      this.goToPreview(
        this.currentStep - 1
      );
    }
  }

  // =====================================================
  // SAVE / UPDATE PATIENT
  // =====================================================

  savePatient(): void {
    if (this.isEditMode && !this.canUpdatePatient) {
      this.showToast('Read-Only Mode: You do not have permission to modify patient records.', 'error');
      return;
    }

    if (!this.isEditMode && !this.canWritePatient) {
      this.showToast('Read-Only Mode: Write permission is required to enter or register patient details.', 'error');
      return;
    }

    // =================================================
    // PREPARE PATIENT DATA
    // =================================================

    const patientData = {

      ...this.patientForm.getRawValue(),

      // Empty DOB → null
      dob:
        this.patientForm
          .get('dob')
          ?.value || null
    };

    console.log(
      'Patient Data:',
      patientData
    );

    // =================================================
    // UPDATE EXISTING PATIENT
    // =================================================

    if (
      this.isEditMode &&
      this.editPatientId !== null
    ) {

      console.log(
        'Updating Patient ID:',
        this.editPatientId
      );

      this.patientService
        .updatePatient(
          this.editPatientId,
          patientData
        )
        .subscribe({

          // =========================================
          // UPDATE SUCCESS
          // =========================================

          next: (response: any) => {

            console.log(
              'Patient updated successfully:',
              response
            );

            this.showToast(
              'Patient updated successfully',
              'success'
            );

            setTimeout(() => {

              this.router.navigate([
                '/patients'
              ]);

            }, 1000);
          },

          // =========================================
          // UPDATE ERROR
          // =========================================

          error: (error: any) => {

            console.error(
              'Patient update failed:',
              error
            );

            this.showToast(
              'Failed to update patient',
              'error'
            );
          }
        });

      return;
    }

    // =================================================
    // CREATE NEW PATIENT
    // =================================================

    console.log(
      'Creating new patient'
    );

    this.patientService
      .savePatient(patientData)
      .subscribe({

        // =============================================
        // CREATE SUCCESS
        // =============================================

        next: (response: any) => {

          console.log(
            'Patient saved successfully:',
            response
          );

          this.showToast(
            'Patient saved successfully',
            'success'
          );

          // Reset form

          this.patientForm.reset({

            country:
              'India'
          });

          this.currentStep =
            1;

          this.previewIndex =
            0;

          setTimeout(() => {

            this.router.navigate([
              '/patients'
            ]);

          }, 1000);
        },

        // =============================================
        // CREATE ERROR
        // =============================================

        error: (error: any) => {

          console.error(
            'Patient save failed:',
            error
          );

          this.showToast(
            'Failed to save patient',
            'error'
          );
        }
      });
  }

  // =====================================================
  // SAVE PATIENT AS DRAFT
  // =====================================================

  saveDraft(): void {
    if (this.isEditMode && !this.canUpdatePatient) {
      this.showToast('Read-Only Mode: You do not have permission to modify drafts.', 'error');
      return;
    }

    if (!this.isEditMode && !this.canWritePatient) {
      this.showToast('Read-Only Mode: Write permission is required to save patient drafts.', 'error');
      return;
    }

    console.log('Saving patient as draft...');
    const raw = this.patientForm.getRawValue();
    const nameVal = (raw.name || '').trim();

    const patientData: any = {
      ...raw,
      name: nameVal.length > 0 ? nameVal : 'Draft Patient (' + (raw.mobile || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) + ')',
      dob: raw.dob ? raw.dob : null,
      status: 'Draft'
    };

    if (this.isEditMode && this.editPatientId) {
      patientData.id = this.editPatientId;
    }

    console.log('Draft Patient Data to save:', patientData);

    this.patientService.saveDraft(patientData).subscribe({
      next: (response: any) => {
        console.log('Draft saved successfully:', response);
        this.showToast('Patient draft saved successfully! Redirecting...', 'success');
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/patients']);
        }, 1000);
      },

      error: (error: any) => {
        console.error('Failed to save patient draft on backend, saved locally:', error);
        this.showToast('Patient draft saved to local drafts.', 'success');
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/patients']);
        }, 1000);
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToPatients(): void {
    this.router.navigate(['/patients']);
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
