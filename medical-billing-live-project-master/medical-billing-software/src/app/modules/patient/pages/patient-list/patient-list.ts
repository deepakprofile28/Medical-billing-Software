import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css'
})
export class PatientList implements OnInit {

  // ==========================================
  // PATIENT DATA
  // ==========================================

  patients: any[] = [];
  filteredPatients: any[] = [];
  paginatedPatients: any[] = [];

  loading = false;
  deletingAll = false;

  // ==========================================
  // DRAFT DATA
  // ==========================================

  draftPatients: any[] = [];
  showDraftPopup = false;
  selectedDraftIds = new Set<number>();

  // ==========================================
  // SEARCH
  // ==========================================

  searchText = '';

  // ==========================================
  // FILTERS
  // ==========================================

  selectedGender = '';
  selectedBloodGroup = '';

  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  pages: number[] = [];

  startItem = 0;
  endItem = 0;

  // ==========================================
  // TOAST
  // ==========================================

  toastMessage = '';

  toastType:
    | 'success'
    | 'error'
    | 'warning'
    | 'info' = 'success';

  showToastMessage = false;

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  // ==========================================
  // ON INIT
  // ==========================================

  ngOnInit(): void {

    console.log(
      'PatientList component initialized'
    );

    this.loadPatients();
  }

  // ==========================================
  // TOAST MESSAGE
  // ==========================================

  showToast(
    message: string,
    type:
      | 'success'
      | 'error'
      | 'warning'
      | 'info' = 'success'
  ): void {

    this.toastMessage = message;
    this.toastType = type;
    this.showToastMessage = true;

    this.cdr.detectChanges();

    setTimeout(() => {

      this.showToastMessage = false;

      this.cdr.detectChanges();

    }, 3000);
  }

  // ==========================================
  // LOAD PATIENTS
  // ==========================================

  loadPatients(): void {

    this.loading = true;

    console.log(
      'Loading approved patients...'
    );

    // ========================================
    // GET ALL PATIENTS
    // ========================================

    this.patientService
      .getPatients()
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (data: any[]) => {

          console.log(
            'All Patients API response:',
            data
          );

          const allPatients = data || [];

          // ==================================
          // APPROVED PATIENTS ONLY
          // ==================================

          this.patients =
            allPatients.filter(
              (patient: any) =>
                String(
                  patient?.status || ''
                )
                  .trim()
                  .toUpperCase() === 'APPROVED'
            );

          console.log(
            'Approved Patients:',
            this.patients
          );

          // ==================================
          // LOAD DRAFT PATIENTS
          // SEPARATE API CALL
          // ==================================

          this.loadDraftPatients();

          // ==================================
          // FILTERED DATA
          // ==================================

          this.filteredPatients = [
            ...this.patients
          ];

          // ==================================
          // RESET PAGINATION
          // ==================================

          this.currentPage = 1;

          this.updatePagination();

          this.loading = false;

          this.cdr.detectChanges();
        },

        // ====================================
        // ERROR
        // ====================================

        error: (error: any) => {

          console.error(
            'Failed to load patients:',
            error
          );

          this.patients = [];
          this.filteredPatients = [];
          this.paginatedPatients = [];

          this.currentPage = 1;

          this.loading = false;

          this.updatePagination();

          this.cdr.detectChanges();

          this.showToast(
            'Failed to load patients',
            'error'
          );
        }

      });
  }

  // ==========================================
  // LOAD DRAFT PATIENTS
  // SEPARATE DRAFT API
  // ==========================================

  loadDraftPatients(): void {

    console.log(
      'Loading draft patients...'
    );

    this.patientService
      .getDraftPatients()
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (response: any[]) => {

          console.log(
            'Draft Patients API response:',
            response
          );

          this.draftPatients =
            response || [];

          console.log(
            'Draft Patients:',
            this.draftPatients
          );

          console.log(
            'Draft Patients Count:',
            this.draftPatients.length
          );

          this.cdr.detectChanges();
        },

        // ====================================
        // ERROR
        // ====================================

        error: (error: any) => {

          console.error(
            'Failed to load draft patients:',
            error
          );

          this.draftPatients = [];

          this.cdr.detectChanges();

          this.showToast(
            'Failed to load draft patients',
            'error'
          );
        }

      });
  }

  // ==========================================
  // OPEN DRAFT POPUP
  // ==========================================

  openDraftPopup(): void {

    console.log(
      'Opening Draft Popup'
    );

    // Refresh drafts before opening popup
    this.loadDraftPatients();

    this.showDraftPopup = true;

    this.cdr.detectChanges();
  }

  // ==========================================
  // CLOSE DRAFT POPUP
  // ==========================================

  closeDraftPopup(): void {

    console.log(
      'Closing Draft Popup'
    );

    this.showDraftPopup = false;
    this.selectedDraftIds.clear();

    this.cdr.detectChanges();
  }

  isDraftSelected(id: number): boolean {
    return this.selectedDraftIds.has(Number(id));
  }

  toggleDraftSelection(id: number): void {
    const draftId = Number(id);

    if (this.selectedDraftIds.has(draftId)) {
      this.selectedDraftIds.delete(draftId);
    } else {
      this.selectedDraftIds.add(draftId);
    }
  }

  areAllDraftsSelected(): boolean {
    return this.draftPatients.length > 0 &&
      this.draftPatients.every(
        (draft: any) => this.selectedDraftIds.has(Number(draft.id))
      );
  }

  toggleAllDrafts(): void {
    if (this.areAllDraftsSelected()) {
      this.selectedDraftIds.clear();
      return;
    }

    this.draftPatients.forEach((draft: any) => {
      this.selectedDraftIds.add(Number(draft.id));
    });
  }

  bulkApproveDrafts(): void {
    const selectedIds = Array.from(this.selectedDraftIds);

    if (selectedIds.length === 0) {
      this.showToast('Select at least one draft', 'warning');
      return;
    }

    if (!window.confirm(`Approve ${selectedIds.length} selected draft(s)?`)) {
      return;
    }

    this.loading = true;
    forkJoin(
      selectedIds.map((id: number) => this.patientService.approvePatient(id))
    ).subscribe({
      next: () => {
        this.closeDraftPopup();
        this.loading = false;
        this.showToast('Selected drafts approved successfully', 'success');
        this.loadPatients();
      },
      error: (error: any) => {
        this.loading = false;
        this.showToast(
          error?.error?.message || 'Failed to approve selected drafts',
          'error'
        );
        this.cdr.detectChanges();
      }
    });
  }

  bulkDeleteDrafts(): void {
    const selectedIds = Array.from(this.selectedDraftIds);

    if (selectedIds.length === 0) {
      this.showToast('Select at least one draft', 'warning');
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} selected draft(s)?`)) {
      return;
    }

    this.loading = true;
    forkJoin(
      selectedIds.map((id: number) => this.patientService.deleteDraft(id))
    ).subscribe({
      next: () => {
        this.closeDraftPopup();
        this.loading = false;
        this.showToast('Selected drafts deleted successfully', 'success');
        this.loadDraftPatients();
      },
      error: (error: any) => {
        this.loading = false;
        this.showToast(
          error?.error?.message || 'Failed to delete selected drafts',
          'error'
        );
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // EDIT DRAFT
  // ==========================================

  editDraft(draft: any): void {

    if (!draft?.id) {

      this.showToast(
        'Draft ID not found',
        'error'
      );

      return;
    }

    console.log(
      'Editing Draft ID:',
      draft.id
    );

    // Close popup
    this.showDraftPopup = false;

    // Navigate to registration page
    this.router.navigate(
      ['/patient-registration'],
      {
        queryParams: {
          id: draft.id
        }
      }
    );
  }

  // ==========================================
  // APPROVE DRAFT
  // ==========================================

  approveDraft(id: number): void {

    // ========================================
    // VALIDATE ID
    // ========================================

    if (!id) {

      this.showToast(
        'Draft ID not found',
        'error'
      );

      return;
    }

    // ========================================
    // CONFIRMATION
    // ========================================

    const confirmed = window.confirm(
      'Are you sure you want to approve this draft?'
    );

    if (!confirmed) {
      return;
    }

    console.log(
      'Approving Draft ID:',
      id
    );

    // ========================================
    // SHOW LOADING
    // ========================================

    this.loading = true;

    this.cdr.detectChanges();

    // ========================================
    // APPROVE DRAFT API
    // ========================================

    this.patientService
      .approvePatient(id)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (response: any) => {

          console.log(
            'Draft approved successfully:',
            response
          );

          // ==================================
          // REMOVE FROM LOCAL DRAFT LIST
          // ==================================

          this.draftPatients =
            this.draftPatients.filter(
              (patient: any) =>
                Number(patient?.id) !==
                Number(id)
            );

          // ==================================
          // CLOSE POPUP
          // ==================================

          this.closeDraftPopup();

          // ==================================
          // STOP LOADING
          // ==================================

          this.loading = false;

          // ==================================
          // SUCCESS MESSAGE
          // ==================================

          this.showToast(
            'Patient draft approved successfully',
            'success'
          );

          // ==================================
          // RELOAD PATIENTS + DRAFTS
          // ==================================

          this.loadPatients();
        },

        // ====================================
        // ERROR
        // ====================================

        error: (error: any) => {

          console.error(
            'Failed to approve draft:',
            error
          );

          this.loading = false;

          const errorMessage =
            error?.error?.message ||
            'Failed to approve draft';

          this.showToast(
            errorMessage,
            'error'
          );

          this.cdr.detectChanges();
        }

      });
  }

  // ==========================================
  // REMOVE DRAFT
  // ==========================================

  removeDraft(id: number): void {

    // ========================================
    // VALIDATE ID
    // ========================================

    if (!id) {

      this.showToast(
        'Draft ID not found',
        'error'
      );

      return;
    }

    // ========================================
    // CONFIRMATION
    // ========================================

    const confirmed = window.confirm(
      'Are you sure you want to remove this draft?'
    );

    if (!confirmed) {
      return;
    }

    console.log(
      'Removing Draft ID:',
      id
    );

    this.loading = true;

    this.cdr.detectChanges();

    // ========================================
    // DELETE DRAFT API
    // ========================================

    this.patientService
      .deleteDraft(id)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (response: any) => {

          console.log(
            'Draft removed successfully:',
            response
          );

          // ==================================
          // REMOVE LOCAL DRAFT
          // ==================================

          this.draftPatients =
            this.draftPatients.filter(
              (patient: any) =>
                Number(patient?.id) !==
                Number(id)
            );

          // ==================================
          // SUCCESS MESSAGE
          // ==================================

          this.showToast(
            'Draft removed successfully',
            'success'
          );

          // ==================================
          // RELOAD DATA
          // ==================================

          this.loadPatients();
        },

        // ====================================
        // ERROR
        // ====================================

        error: (error: any) => {

          console.error(
            'Failed to remove draft:',
            error
          );

          this.showToast(
            'Failed to remove draft',
            'error'
          );

          this.cdr.detectChanges();
        },

      });
  }

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  applyFilters(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    this.filteredPatients =
      this.patients.filter(
        (patient: any) => {

          // ==================================
          // SEARCH
          // ==================================

          const matchesSearch =
            !search ||

            String(
              patient?.id || ''
            )
              .toLowerCase()
              .includes(search) ||

            String(
              patient?.name || ''
            )
              .toLowerCase()
              .includes(search) ||

            String(
              patient?.mobile || ''
            )
              .toLowerCase()
              .includes(search) ||

            String(
              patient?.email || ''
            )
              .toLowerCase()
              .includes(search) ||

            String(
              patient?.city || ''
            )
              .toLowerCase()
              .includes(search) ||

            String(
              patient?.state || ''
            )
              .toLowerCase()
              .includes(search);

          // ==================================
          // GENDER
          // ==================================

          const matchesGender =
            !this.selectedGender ||

            String(
              patient?.gender || ''
            )
              .toLowerCase() ===
            this.selectedGender
              .toLowerCase();

          // ==================================
          // BLOOD GROUP
          // ==================================

          const matchesBloodGroup =
            !this.selectedBloodGroup ||

            String(
              patient?.bloodGroup || ''
            )
              .toLowerCase() ===
            this.selectedBloodGroup
              .toLowerCase();

          // ==================================
          // FINAL RESULT
          // ==================================

          return (
            matchesSearch &&
            matchesGender &&
            matchesBloodGroup
          );
        }
      );

    console.log(
      'Filtered Patients:',
      this.filteredPatients
    );

    this.currentPage = 1;

    this.updatePagination();
  }

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedGender = '';

    this.selectedBloodGroup = '';

    this.filteredPatients = [
      ...this.patients
    ];

    this.currentPage = 1;

    this.updatePagination();
  }

  // ==========================================
  // ADD NEW PATIENT
  // ==========================================

  addNewPatient(): void {

    console.log(
      'Opening New Patient Registration'
    );

    this.router.navigate([
      '/patient-registration'
    ]);
  }

  // ==========================================
  // VIEW PATIENT
  // ==========================================

  viewPatient(patient: any): void {

    if (!patient?.id) {

      this.showToast(
        'Patient ID not found',
        'error'
      );

      return;
    }

    console.log(
      'Viewing Patient ID:',
      patient.id
    );

    this.router.navigate(
      ['/patient-details'],
      {
        queryParams: {
          id: patient.id
        }
      }
    );
  }

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  editPatient(patient: any): void {

    if (!patient?.id) {

      this.showToast(
        'Patient ID not found',
        'error'
      );

      return;
    }

    console.log(
      'Edit Patient ID:',
      patient.id
    );

    this.router.navigate(
      ['/patient-registration'],
      {
        queryParams: {
          id: patient.id
        }
      }
    );
  }

  // ==========================================
  // DELETE SINGLE PATIENT
  // ==========================================

  deletePatient(id: number): void {

    if (!id) {

      this.showToast(
        'Patient ID not found',
        'error'
      );

      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this patient?'
    );

    if (!confirmed) {
      return;
    }

    console.log(
      'Deleting Patient ID:',
      id
    );

    this.patientService
      .deletePatient(id)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (response: any) => {

          console.log(
            'Patient deleted successfully:',
            response
          );

          this.patients = this.patients.filter(
            (patient: any) => Number(patient?.id) !== Number(id)
          );

          this.filteredPatients = this.filteredPatients.filter(
            (patient: any) => Number(patient?.id) !== Number(id)
          );

          this.paginatedPatients = this.paginatedPatients.filter(
            (patient: any) => Number(patient?.id) !== Number(id)
          );

          this.updatePagination();

          this.showToast(
            'Patient deleted successfully',
            'success'
          );

          this.cdr.detectChanges();
        },

        // ====================================
        // ERROR
        // ====================================

        error: (error: any) => {

          console.error(
            'Failed to delete patient:',
            error
          );

          this.showToast(
            'Failed to delete patient',
            'error'
          );

          this.cdr.detectChanges();
        }

      });
  }

  // ==========================================
  // DELETE ALL PATIENTS
  // ==========================================

  deleteAllPatients(): void {

    if (this.patients.length === 0) {

      this.showToast(
        'No patients available to delete',
        'warning'
      );

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${this.patients.length} patients?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    console.log(
      'Deleting all patients:',
      this.patients.length
    );

    this.loading = true;
    this.deletingAll = true;

    const deleteRequests =
      this.patients.map(
        (patient: any) =>
          this.patientService
            .deletePatient(patient.id)
            .pipe(
              catchError((error: any) =>
                of({
                  failed: true,
                  id: patient.id,
                  error
                })
              )
            )
      );

    forkJoin(deleteRequests)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (responses: any[]) => {

          const failedIds = responses
            .filter((response: any) => response?.failed)
            .map((response: any) => Number(response.id));

          const deletedIds = this.patients
            .map((patient: any) => Number(patient.id))
            .filter((id: number) => !failedIds.includes(id));

          console.log(
            'All patients deleted successfully:',
            responses
          );

          this.patients = this.patients.filter(
            (patient: any) => !deletedIds.includes(Number(patient.id))
          );

          this.filteredPatients = this.filteredPatients.filter(
            (patient: any) => !deletedIds.includes(Number(patient.id))
          );

          this.updatePagination();

          this.cdr.detectChanges();

          this.showToast(
            failedIds.length === 0
              ? 'All patients deleted successfully'
              : `${deletedIds.length} patients deleted. ${failedIds.length} could not be deleted.`,
            failedIds.length === 0 ? 'success' : 'warning'
          );

          // Refresh drafts also
          this.loadDraftPatients();
        },

        // ====================================
        // ERROR
        // ====================================

        error: (error: any) => {

          console.error(
            'Failed to delete all patients:',
            error
          );

          this.loading = false;
          this.deletingAll = false;

          this.showToast(
            'Failed to delete all patients',
            'error'
          );

          this.loadPatients();
        },

        complete: () => {
          this.loading = false;
          this.deletingAll = false;
          this.cdr.detectChanges();
        }

      });
  }

  // ==========================================
  // DOWNLOAD PATIENTS EXCEL
  // ==========================================

  downloadExcel(): void {

    const data =
      this.filteredPatients.map(
        (patient: any) => ({

          ID:
            patient?.id || '',

          Name:
            patient?.name || '',

          Mobile:
            patient?.mobile || '',

          Email:
            patient?.email || '',

          'Date of Birth':
            patient?.dob || '',

          Gender:
            patient?.gender || '',

          'Blood Group':
            patient?.bloodGroup || '',

          'Marital Status':
            patient?.maritalStatus || '',

          Occupation:
            patient?.occupation || '',

          'Aadhaar Number':
            patient?.aadhaar || '',

          'PAN Number':
            patient?.pan || '',

          'Emergency Contact':
            patient?.emergencyContact || '',

          'Emergency Contact Name':
            patient?.emergencyName || '',

          'Address 1':
            patient?.address1 || '',

          'Address 2':
            patient?.address2 || '',

          District:
            patient?.district || '',

          City:
            patient?.city || '',

          State:
            patient?.state || '',

          Country:
            patient?.country || 'India',

          Pincode:
            patient?.pincode || '',

          'Medical History':
            patient?.medicalHistory || '',

          'Current Medication':
            patient?.currentMedication || '',

          Allergies:
            patient?.allergies || '',

          'Insurance Provider':
            patient?.insuranceProvider || '',

          'Policy Number':
            patient?.policyNumber || '',

          'Policy Holder Name':
            patient?.policyHolderName || ''

        })
      );

    // ========================================
    // NO DATA
    // ========================================

    if (data.length === 0) {

      this.showToast(
        'No patient data available to download',
        'warning'
      );

      return;
    }

    // ========================================
    // CREATE WORKSHEET
    // ========================================

    const worksheet: XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(data);

    // ========================================
    // CREATE WORKBOOK
    // ========================================

    const workbook: XLSX.WorkBook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Patients'
    );

    // ========================================
    // DOWNLOAD
    // ========================================

    XLSX.writeFile(
      workbook,
      'Patient_List.xlsx'
    );
  }

  // ==========================================
  // IMPORT PATIENTS FROM EXCEL
  // ==========================================

  importExcel(event: any): void {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      (e: any) => {

        try {

          // ==================================
          // READ EXCEL
          // ==================================

          const data =
            new Uint8Array(
              e.target.result
            );

          const workbook =
            XLSX.read(
              data,
              {
                type: 'array'
              }
            );

          const sheetName =
            workbook.SheetNames[0];

          const worksheet =
            workbook.Sheets[sheetName];

          const excelData: any[] =
            XLSX.utils.sheet_to_json(
              worksheet,
              {
                defval: ''
              }
            );

          console.log(
            'Raw Excel Data:',
            excelData
          );

          // ==================================
          // EMPTY EXCEL CHECK
          // ==================================

          if (!excelData.length) {

            this.showToast(
              'Excel file is empty',
              'warning'
            );

            return;
          }

          console.log(
            'Excel Headers:',
            Object.keys(
              excelData[0]
            )
          );

          // ==================================
          // CONVERT EXCEL DATA
          // ==================================

          const patients =
            excelData

              .map(
                (row: any) => {

                  const patient = {

                    // PERSONAL DETAILS

                    name:
                      this.getExcelValue(
                        row,
                        [
                          'Name',
                          'NAME',
                          'Patient Name',
                          'patientName'
                        ]
                      ),

                    mobile:
                      this.getExcelValue(
                        row,
                        [
                          'Mobile',
                          'MOBILE',
                          'Mobile Number',
                          'Phone'
                        ]
                      ),

                    email:
                      this.getExcelValue(
                        row,
                        [
                          'Email',
                          'EMAIL',
                          'Email Address'
                        ]
                      ),

                    dob:
                      this.getExcelDateValue(
                        row,
                        [
                          'Date of Birth',
                          'DOB',
                          'Date Of Birth',
                          'dob'
                        ]
                      ),

                    gender:
                      this.getExcelValue(
                        row,
                        [
                          'Gender',
                          'GENDER'
                        ]
                      ),

                    bloodGroup:
                      this.getExcelValue(
                        row,
                        [
                          'Blood Group',
                          'BloodGroup',
                          'BLOOD GROUP'
                        ]
                      ),

                    maritalStatus:
                      this.getExcelValue(
                        row,
                        [
                          'Marital Status',
                          'MaritalStatus'
                        ]
                      ),

                    occupation:
                      this.getExcelValue(
                        row,
                        [
                          'Occupation',
                          'OCCUPATION'
                        ]
                      ),

                    aadhaar:
                      this.getExcelValue(
                        row,
                        [
                          'Aadhaar Number',
                          'Aadhaar',
                          'Aadhar Number',
                          'Aadhar'
                        ]
                      ),

                    pan:
                      this.getExcelValue(
                        row,
                        [
                          'PAN Number',
                          'PAN',
                          'Pan Number'
                        ]
                      ),

                    // EMERGENCY CONTACT

                    emergencyContact:
                      this.getExcelValue(
                        row,
                        [
                          'Emergency Contact',
                          'Emergency Phone',
                          'Emergency Contact Number',
                          'EmergencyContact'
                        ]
                      ),

                    emergencyName:
                      this.getExcelValue(
                        row,
                        [
                          'Emergency Contact Name',
                          'Emergency Name',
                          'EmergencyName'
                        ]
                      ),

                    // ADDRESS DETAILS

                    address1:
                      this.getExcelValue(
                        row,
                        [
                          'Address 1',
                          'Address1',
                          'Address'
                        ]
                      ),

                    address2:
                      this.getExcelValue(
                        row,
                        [
                          'Address 2',
                          'Address2'
                        ]
                      ),

                    district:
                      this.getExcelValue(
                        row,
                        [
                          'District',
                          'DISTRICT'
                        ]
                      ),

                    city:
                      this.getExcelValue(
                        row,
                        [
                          'City',
                          'CITY'
                        ]
                      ),

                    state:
                      this.getExcelValue(
                        row,
                        [
                          'State',
                          'STATE'
                        ]
                      ),

                    country:
                      this.getExcelValue(
                        row,
                        [
                          'Country',
                          'COUNTRY'
                        ]
                      ) || 'India',

                    pincode:
                      this.getExcelValue(
                        row,
                        [
                          'Pincode',
                          'PIN Code',
                          'PIN',
                          'Postal Code'
                        ]
                      ),

                    // MEDICAL DETAILS

                    medicalHistory:
                      this.getExcelValue(
                        row,
                        [
                          'Medical History',
                          'MedicalHistory'
                        ]
                      ),

                    currentMedication:
                      this.getExcelValue(
                        row,
                        [
                          'Current Medication',
                          'CurrentMedication',
                          'Medication'
                        ]
                      ),

                    allergies:
                      this.getExcelValue(
                        row,
                        [
                          'Allergies',
                          'ALLERGIES'
                        ]
                      ),

                    // INSURANCE DETAILS

                    insuranceProvider:
                      this.getExcelValue(
                        row,
                        [
                          'Insurance Provider',
                          'InsuranceProvider'
                        ]
                      ),

                    policyNumber:
                      this.getExcelValue(
                        row,
                        [
                          'Policy Number',
                          'PolicyNumber'
                        ]
                      ),

                    policyHolderName:
                      this.getExcelValue(
                        row,
                        [
                          'Policy Holder Name',
                          'PolicyHolderName',
                          'Policy Holder'
                        ]
                      )
                  };

                  console.log(
                    'Converted Patient:',
                    patient
                  );

                  return patient;
                }
              )

              // REMOVE BLANK ROWS

              .filter(
                (patient: any) =>
                  patient?.name ||
                  patient?.mobile ||
                  patient?.email
              );

          // ==================================
          // VALIDATION
          // ==================================

          if (patients.length === 0) {

            this.showToast(
              'No valid patient data found in Excel.',
              'warning'
            );

            return;
          }

          console.log(
            'Patients ready for upload:',
            patients
          );

          // ==================================
          // SAVE PATIENTS
          // ==================================

          this.loading = true;

          const requests =
            patients.map(
              (patient: any) =>
                this.patientService
                  .savePatient(patient)
            );

          forkJoin(requests)
            .subscribe({

              // ==============================
              // SUCCESS
              // ==============================

              next: (responses: any[]) => {

                console.log(
                  'Imported successfully:',
                  responses
                );

                this.loading = false;

                this.showToast(
                  `${patients.length} patients imported successfully`,
                  'success'
                );

                this.loadPatients();
              },

              // ==============================
              // ERROR
              // ==============================

              error: (error: any) => {

                console.error(
                  'Excel import API failed:',
                  error
                );

                this.loading = false;

                this.showToast(
                  'Failed to import patients',
                  'error'
                );
              }

            });

        } catch (error) {

          console.error(
            'Excel processing error:',
            error
          );

          this.loading = false;

          this.showToast(
            'Invalid Excel file',
            'error'
          );
        }
      };

    reader.readAsArrayBuffer(file);

    // Allow same file again
    event.target.value = '';
  }

  // ==========================================
  // GET EXCEL VALUE
  // ==========================================

  private getExcelValue(
    row: any,
    possibleHeaders: string[]
  ): string {

    const rowKeys =
      Object.keys(row);

    for (
      const header of possibleHeaders
    ) {

      const matchingKey =
        rowKeys.find(
          (key: string) =>
            key
              .trim()
              .toLowerCase() ===
            header
              .trim()
              .toLowerCase()
        );

      if (matchingKey) {

        return String(
          row[matchingKey] ?? ''
        ).trim();
      }
    }

    return '';
  }

  // ==========================================
  // GET EXCEL DATE VALUE
  // ==========================================

  private getExcelDateValue(
    row: any,
    possibleHeaders: string[]
  ): string {

    const rowKeys =
      Object.keys(row);

    let value: any = '';

    for (
      const header of possibleHeaders
    ) {

      const matchingKey =
        rowKeys.find(
          (key: string) =>
            key
              .trim()
              .toLowerCase() ===
            header
              .trim()
              .toLowerCase()
        );

      if (matchingKey) {

        value =
          row[matchingKey];

        break;
      }
    }

    // ========================================
    // EMPTY VALUE
    // ========================================

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '';
    }

    // ========================================
    // EXCEL SERIAL DATE
    // ========================================

    if (
      typeof value === 'number'
    ) {

      const excelDate =
        XLSX.SSF.parse_date_code(
          value
        );

      if (excelDate) {

        const month =
          String(
            excelDate.m
          ).padStart(2, '0');

        const day =
          String(
            excelDate.d
          ).padStart(2, '0');

        return `${excelDate.y}-${month}-${day}`;
      }
    }

    // ========================================
    // NORMAL DATE STRING
    // ========================================

    const date =
      new Date(value);

    if (
      !isNaN(
        date.getTime()
      )
    ) {

      return date
        .toISOString()
        .split('T')[0];
    }

    return String(
      value
    ).trim();
  }

  // ==========================================
  // UPDATE PAGINATION
  // ==========================================

  updatePagination(): void {

    this.totalPages =
      Math.ceil(
        this.filteredPatients.length /
        this.pageSize
      );

    if (
      this.totalPages === 0
    ) {

      this.totalPages = 1;
    }

    if (
      this.currentPage >
      this.totalPages
    ) {

      this.currentPage =
        this.totalPages;
    }

    const start =
      (this.currentPage - 1) *
      this.pageSize;

    const end =
      start + this.pageSize;

    // ========================================
    // CURRENT PAGE DATA
    // ========================================

    this.paginatedPatients =
      this.filteredPatients.slice(
        start,
        end
      );

    // ========================================
    // PAGE NUMBERS
    // ========================================

    this.pages =
      Array.from(
        {
          length:
            this.totalPages
        },
        (_, index) =>
          index + 1
      );

    // ========================================
    // ITEM COUNT
    // ========================================

    if (
      this.filteredPatients.length === 0
    ) {

      this.startItem = 0;

      this.endItem = 0;

    } else {

      this.startItem =
        start + 1;

      this.endItem =
        Math.min(
          end,
          this.filteredPatients.length
        );
    }
  }

  // ==========================================
  // NEXT PAGE
  // ==========================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;

      this.updatePagination();
    }
  }

  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  previousPage(): void {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;

      this.updatePagination();
    }
  }

  // ==========================================
  // GO TO PAGE
  // ==========================================

  goToPage(
    page: number
  ): void {

    if (
      page >= 1 &&
      page <= this.totalPages
    ) {

      this.currentPage = page;

      this.updatePagination();
    }
  }

  // ==========================================
  // CHANGE PAGE SIZE
  // ==========================================

  changePageSize(): void {

    this.currentPage = 1;

    this.updatePagination();
  }

}