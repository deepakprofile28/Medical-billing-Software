import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import {
  catchError,
  forkJoin,
  of
} from 'rxjs';

import {
  PatientService,
  Patient
} from '../../../services/patient.service';

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

  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  paginatedPatients: Patient[] = [];

  get todayPatientsCount(): number {
    return this.patients.filter((patient) => this.isPatientCreatedToday(patient)).length;
  }

  todayOnly = false;

  readonly columnOptions = [
    { key: 'id', label: 'ID', default: true },
    { key: 'name', label: 'Name', default: true },
    { key: 'mobile', label: 'Mobile', default: true },
    { key: 'email', label: 'Email', default: true },
    { key: 'gender', label: 'Gender', default: true },
    { key: 'bloodGroup', label: 'Blood Group', default: true },
    { key: 'city', label: 'City', default: true },
    { key: 'state', label: 'State', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'createdDate', label: 'Created Date', default: true },
    { key: 'dob', label: 'Date of Birth', default: false },
    { key: 'maritalStatus', label: 'Marital Status', default: false },
    { key: 'occupation', label: 'Occupation', default: false },
    { key: 'aadhaar', label: 'Aadhaar', default: false },
    { key: 'pan', label: 'PAN', default: false },
    { key: 'emergencyContact', label: 'Emergency Contact', default: false },
    { key: 'emergencyName', label: 'Emergency Name', default: false },
    { key: 'address1', label: 'Address', default: false },
    { key: 'address2', label: 'Address 2', default: false },
    { key: 'district', label: 'District', default: false },
    { key: 'country', label: 'Country', default: false },
    { key: 'pincode', label: 'Pincode', default: false },
    { key: 'medicalHistory', label: 'Medical History', default: false },
    { key: 'currentMedication', label: 'Current Medication', default: false },
    { key: 'allergies', label: 'Allergies', default: false },
    { key: 'insuranceProvider', label: 'Insurance Provider', default: false },
    { key: 'policyNumber', label: 'Policy Number', default: false },
    { key: 'policyHolderName', label: 'Policy Holder', default: false }
  ];

  private readonly columnStorageKey = 'patient-list-visible-columns';
  private readonly customColumnStorageKey = 'patient-list-custom-columns';

  visibleColumns: Record<string, boolean> = {};
  userColumnOptions: Array<{
    key: string;
    label: string;
    inputType: 'text' | 'dropdown' | 'multi-select';
    options: string[];
    default: false;
  }> = [];

  showCustomColumnForm = false;
  editingCustomColumnKey: string | null = null;
  customColumnLabel = '';
  customColumnInputType: 'text' | 'dropdown' | 'multi-select' = 'text';
  customColumnOptionValues: string[] = [''];
  draggedCustomColumnKey: string | null = null;
  @ViewChild('columnsMenuDetails') columnsMenuDetails?: ElementRef<HTMLDetailsElement>;

  // ================= CLOSE ON OUTSIDE CLICK =================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.columnsMenuDetails?.nativeElement) {
      return;
    }

    const clickedInside = this.columnsMenuDetails.nativeElement.contains(event.target as Node);
    if (!clickedInside && this.columnsMenuDetails.nativeElement.open) {
      this.columnsMenuDetails.nativeElement.open = false;
    }
  }

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.loadCustomColumns();
    this.loadColumnSelection();
  }

  isColumnVisible(column: string): boolean {
    return this.visibleColumns[column] === true;
  }

  toggleColumn(column: string): void {
    this.visibleColumns[column] = !this.visibleColumns[column];
    this.saveColumnSelection();
  }

  openCustomColumnForm(): void {
    this.editingCustomColumnKey = null;
    this.customColumnOptionValues = [''];
    this.showCustomColumnForm = true;
  }

  editCustomColumn(column: {
    key: string;
    label: string;
    inputType?: string;
    options?: string[];
  }): void {
    this.editingCustomColumnKey = column.key;
    this.customColumnLabel = column.label;
    this.customColumnInputType = column.inputType === 'dropdown' ||
      column.inputType === 'multi-select'
      ? column.inputType
      : 'text';
    this.customColumnOptionValues = column.options?.length
      ? [...column.options]
      : [''];
    this.showCustomColumnForm = true;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByColumnKey(index: number, column: { key: string }): string {
    return column.key;
  }

  addCustomColumnOption(): void {
    this.customColumnOptionValues.push('');
  }

  handleCustomColumnOptionKeydown(
    event: KeyboardEvent,
    optionIndex: number
  ): void {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (optionIndex === this.customColumnOptionValues.length - 1) {
      this.addCustomColumnOption();
    }

    setTimeout(() => {
      document
        .getElementById(`custom-column-option-${optionIndex + 1}`)
        ?.focus();
    });
  }

  removeCustomColumnOption(index: number): void {
    if (this.customColumnOptionValues.length === 1) {
      this.customColumnOptionValues[0] = '';
      return;
    }

    this.customColumnOptionValues.splice(index, 1);
  }

  removeCustomColumn(column: { key: string }): void {
    this.userColumnOptions = this.userColumnOptions.filter(
      (item) => item.key !== column.key
    );
    delete this.visibleColumns[column.key];
    this.saveCustomColumns();
    this.saveColumnSelection();

    if (this.editingCustomColumnKey === column.key) {
      this.cancelCustomColumnForm();
    }
  }

  startCustomColumnDrag(columnKey: string): void {
    this.draggedCustomColumnKey = columnKey;
  }

  dropCustomColumn(targetColumnKey: string): void {
    if (!this.draggedCustomColumnKey || this.draggedCustomColumnKey === targetColumnKey) {
      this.draggedCustomColumnKey = null;
      return;
    }

    const draggedIndex = this.userColumnOptions.findIndex(
      (column) => column.key === this.draggedCustomColumnKey
    );
    const targetIndex = this.userColumnOptions.findIndex(
      (column) => column.key === targetColumnKey
    );

    if (draggedIndex < 0 || targetIndex < 0) {
      this.draggedCustomColumnKey = null;
      return;
    }

    const [column] = this.userColumnOptions.splice(draggedIndex, 1);
    this.userColumnOptions.splice(targetIndex, 0, column);
    this.draggedCustomColumnKey = null;
    this.saveCustomColumns();
  }

  cancelCustomColumnForm(): void {
    this.showCustomColumnForm = false;
    this.editingCustomColumnKey = null;
    this.customColumnLabel = '';
    this.customColumnInputType = 'text';
    this.customColumnOptionValues = [''];
  }

  addCustomColumn(): void {
    const label = this.customColumnLabel.trim();

    if (!label) {
      return;
    }

    const options = this.getCustomColumnOptions();
    const existingColumn = this.userColumnOptions.find(
      (column) => column.key === this.editingCustomColumnKey
    );

    if (existingColumn) {
      existingColumn.label = label;
      existingColumn.inputType = this.customColumnInputType;
      existingColumn.options = options;
    } else {
      const key = `custom_${Date.now()}`;
      this.userColumnOptions.push({
        key,
        label,
        inputType: this.customColumnInputType,
        options,
        default: false
      });
      this.visibleColumns[key] = true;
    }

    this.saveCustomColumns();
    this.saveColumnSelection();
    this.cancelCustomColumnForm();

    // Automatically close the Columns dropdown popup
    if (this.columnsMenuDetails?.nativeElement) {
      this.columnsMenuDetails.nativeElement.open = false;
    }
  }

  private getCustomColumnOptions(): string[] {
    if (this.customColumnInputType === 'text') {
      return [];
    }

    return this.customColumnOptionValues
      .map((option) => option.trim())
      .filter(Boolean);
  }

  get allSelectableColumns(): Array<{
    key: string;
    label: string;
    default: boolean;
    inputType?: string;
    options?: string[];
  }> {
    return [...this.columnOptions, ...this.userColumnOptions];
  }

  get userColumnValues(): typeof this.userColumnOptions {
    return this.userColumnOptions;
  }

  getCustomColumnValue(
    patient: Patient,
    column: typeof this.userColumnOptions[number]
  ): string {
    const patientValues = patient as Patient & Record<string, unknown>;
    const value = patientValues[column.key];

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '--';
    }

    return value === null || value === undefined || value === ''
      ? '--'
      : String(value);
  }

  resetColumnSelection(): void {
    this.visibleColumns = Object.fromEntries(
      this.allSelectableColumns.map((column) => [column.key, column.default])
    );
    this.saveColumnSelection();
  }

  get customColumnOptions(): typeof this.columnOptions {
    return this.columnOptions.filter((column) => !column.default);
  }

  private loadColumnSelection(): void {
    const storedColumns = localStorage.getItem(this.columnStorageKey);

    if (!storedColumns) {
      this.resetColumnSelection();
      return;
    }

    try {
      const parsedColumns = JSON.parse(storedColumns) as Record<string, boolean>;

      this.visibleColumns = Object.fromEntries(
        this.allSelectableColumns.map((column) => [
          column.key,
          parsedColumns[column.key] === undefined
            ? column.default
            : parsedColumns[column.key] === true
        ])
      );
    } catch {
      this.resetColumnSelection();
    }
  }

  private loadCustomColumns(): void {
    const storedColumns = localStorage.getItem(this.customColumnStorageKey);

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

      this.userColumnOptions = parsedColumns
        .filter((column) => column.key && column.label)
        .map((column) => ({
          ...column,
          inputType: column.inputType || 'text',
          options: column.options || [],
          default: false as false
        }));
    } catch {
      this.userColumnOptions = [];
    }
  }

  private saveCustomColumns(): void {
    localStorage.setItem(
      this.customColumnStorageKey,
      JSON.stringify(this.userColumnOptions)
    );
  }

  private saveColumnSelection(): void {
    localStorage.setItem(
      this.columnStorageKey,
      JSON.stringify(this.visibleColumns)
    );
  }

  get visibleColumnCount(): number {
    return this.allSelectableColumns.filter(
      (column) => this.isColumnVisible(column.key)
    ).length;
  }

  private isPatientCreatedToday(patient: Patient): boolean {
    if (!patient.createdDate) {
      return false;
    }

    const today = new Date();
    const createdDate = new Date(patient.createdDate);

    return !Number.isNaN(createdDate.getTime()) &&
      createdDate.getFullYear() === today.getFullYear() &&
      createdDate.getMonth() === today.getMonth() &&
      createdDate.getDate() === today.getDate();
  }

  showTodayPatients(): void {
    this.todayOnly = !this.todayOnly;
    this.applyFilters();
  }

  showAllPatients(): void {
    this.todayOnly = false;
    this.applyFilters();
  }

  loading = false;
  deletingAll = false;

  // ==========================================
  // DRAFT DATA
  // ==========================================

  draftPatients: Patient[] = [];

  showDraftPopup = false;

  selectedDraftIds = new Set<number>();

  selectedPatient: Patient | null = null;

  showPatientPreview = false;

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
  // LOAD APPROVED PATIENTS
  // ==========================================

  loadPatients(): void {

    this.loading = true;

    console.log(
      'Loading approved patients...'
    );

    this.patientService
      .getAllPatients()
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (data: Patient[]) => {

          console.log(
            'All Patients API response:',
            data
          );

          const allPatients =
            data || [];

          // ==================================
          // APPROVED PATIENTS ONLY & DEDUPLICATE
          // ==================================
          const seen = new Set<string>();
          const uniquePatients: Patient[] = [];

          for (const patient of allPatients) {
            const s = String(patient?.status || '').trim().toUpperCase();
            if (s === 'DRAFT') continue;

            const nameKey = (patient.name || '').trim().toLowerCase();
            const emailKey = (patient.email || '').trim().toLowerCase();
            const mobileKey = (patient.mobile || '').trim();
            const dedupeKey = nameKey && emailKey ? `${nameKey}_${emailKey}` : (patient.id ? `id_${patient.id}` : `${nameKey}_${mobileKey}`);

            if (!seen.has(dedupeKey)) {
              seen.add(dedupeKey);
              uniquePatients.push(patient);
            }
          }

          this.patients = uniquePatients;

          console.log(
            'Approved Patients:',
            this.patients
          );

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

          // ==================================
          // LOAD DRAFT PATIENTS
          // ==================================

          this.loadDraftPatients();
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

          this.updatePagination();

          this.loading = false;

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

        next: (response: Patient[]) => {

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

    this.loadDraftPatients();

    this.showDraftPopup = true;

    document.body.style.overflow = 'hidden';

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

    document.body.style.overflow = '';

    this.selectedDraftIds.clear();

    this.cdr.detectChanges();
  }

  // ==========================================
  // CHECK DRAFT SELECTED
  // ==========================================
isDraftSelected(id: number | undefined): boolean {
  if (id === undefined || id === null) {
    return false;
  }

  return this.selectedDraftIds.has(
    Number(id)
  );
}
  // ==========================================
  // TOGGLE DRAFT SELECTION
  // ==========================================
toggleDraftSelection(id: number | undefined): void {

  if (id === undefined || id === null) {
    return;
  }

  const draftId = Number(id);

  if (this.selectedDraftIds.has(draftId)) {
    this.selectedDraftIds.delete(draftId);
  } else {
    this.selectedDraftIds.add(draftId);
  }
}
  // ==========================================
  // CHECK ALL DRAFTS SELECTED
  // ==========================================

  areAllDraftsSelected(): boolean {

    return (
      this.draftPatients.length > 0 &&
      this.draftPatients.every(
        (draft: Patient) =>
          this.selectedDraftIds.has(
            Number(draft.id)
          )
      )
    );
  }

  // ==========================================
  // TOGGLE ALL DRAFTS
  // ==========================================

  toggleAllDrafts(): void {

    if (
      this.areAllDraftsSelected()
    ) {

      this.selectedDraftIds.clear();

      return;
    }

    this.draftPatients.forEach(
      (draft: Patient) => {

        if (draft.id !== undefined) {

          this.selectedDraftIds.add(
            Number(draft.id)
          );
        }
      }
    );
  }

  // ==========================================
  // BULK APPROVE DRAFTS
  // ==========================================

  bulkApproveDrafts(): void {

    const selectedIds =
      Array.from(
        this.selectedDraftIds
      );

    if (
      selectedIds.length === 0
    ) {

      this.showToast(
        'Select at least one draft',
        'warning'
      );

      return;
    }

    if (
      !window.confirm(
        `Approve ${selectedIds.length} selected draft(s)?`
      )
    ) {

      return;
    }

    this.loading = true;

    const requests =
      selectedIds.map(
        (id: number) =>
          this.patientService
            .approvePatient(id)
      );

    forkJoin(requests)
      .subscribe({

        next: () => {

          this.closeDraftPopup();

          this.loading = false;

          this.showToast(
            'Selected drafts approved successfully',
            'success'
          );

          this.loadPatients();
        },

        error: (error: any) => {

          console.error(
            'Failed to approve selected drafts:',
            error
          );

          this.loading = false;

          this.showToast(
            error?.error?.message ||
              'Failed to approve selected drafts',
            'error'
          );

          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // BULK DELETE DRAFTS
  // ==========================================

  bulkDeleteDrafts(): void {

    const selectedIds =
      Array.from(
        this.selectedDraftIds
      );

    if (
      selectedIds.length === 0
    ) {

      this.showToast(
        'Select at least one draft',
        'warning'
      );

      return;
    }

    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected draft(s)?`
      )
    ) {

      return;
    }

    this.loading = true;

    const requests =
      selectedIds.map(
        (id: number) =>
          this.patientService
            .deleteDraft(id)
      );

    forkJoin(requests)
      .subscribe({

        next: () => {

          this.closeDraftPopup();

          this.loading = false;

          this.showToast(
            'Selected drafts deleted successfully',
            'success'
          );

          this.loadDraftPatients();
        },

        error: (error: any) => {

          console.error(
            'Failed to delete selected drafts:',
            error
          );

          this.loading = false;

          this.showToast(
            error?.error?.message ||
              'Failed to delete selected drafts',
            'error'
          );

          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // EDIT DRAFT
  // ==========================================

  editDraft(draft: Patient): void {

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

    this.closeDraftPopup();

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
approveDraft(id: number | undefined): void {

  if (id === undefined || id === null) {
    this.showToast(
      'Draft ID not found',
      'error'
    );
    return;
  }

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

  this.loading = true;
  this.cdr.detectChanges();

  this.patientService
    .approvePatient(id)
    .subscribe({

      next: (response: any) => {

        console.log(
          'Draft approved successfully:',
          response
        );

        this.draftPatients =
          this.draftPatients.filter(
            (patient: any) =>
              Number(patient?.id) !== Number(id)
          );

        this.closeDraftPopup();

        this.loading = false;

        this.showToast(
          'Patient draft approved successfully',
          'success'
        );

        this.loadPatients();
      },

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
removeDraft(id: number | undefined): void {

  if (id === undefined || id === null) {
    this.showToast(
      'Draft ID not found',
      'error'
    );
    return;
  }

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

  this.patientService
    .deleteDraft(id)
    .subscribe({

      next: (response: any) => {

        console.log(
          'Draft removed successfully:',
          response
        );

        this.draftPatients =
          this.draftPatients.filter(
            (patient: any) =>
              Number(patient?.id) !== Number(id)
          );

        this.loading = false;

        this.showToast(
          'Draft removed successfully',
          'success'
        );

        this.loadPatients();
      },

      error: (error: any) => {

        console.error(
          'Failed to remove draft:',
          error
        );

        this.loading = false;

        this.showToast(
          'Failed to remove draft',
          'error'
        );

        this.cdr.detectChanges();
      }
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
        (patient: Patient) => {

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

          const matchesToday =
            !this.todayOnly ||
            this.isPatientCreatedToday(patient);

          return (
            matchesSearch &&
            matchesGender &&
            matchesBloodGroup &&
            matchesToday
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

    this.todayOnly = false;

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

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToUsers(): void {
    this.router.navigate(['/users']);
  }

  // ==========================================
  // VIEW PATIENT
  // ==========================================

  viewPatient(patient: Patient): void {

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
  // OPEN PATIENT PREVIEW
  // ==========================================

  openPatientPreview(
    patient: Patient
  ): void {

    if (!patient?.id) {

      this.showToast(
        'Patient ID not found',
        'error'
      );

      return;
    }

    this.selectedPatient =
      patient;

    this.showPatientPreview = true;
    document.body.style.overflow = 'hidden';

    this.cdr.detectChanges();
  }

  // ==========================================
  // CLOSE PATIENT PREVIEW
  // ==========================================

  closePatientPreview(): void {

    this.showPatientPreview = false;

    this.selectedPatient = null;
    document.body.style.overflow = '';

    this.cdr.detectChanges();
  }

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  editPatient(patient: Patient): void {

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
deletePatient(id: number | undefined): void {

  if (!id) {
    this.showToast('Patient ID not found', 'error');
    return;
  }

  if (!window.confirm('Are you sure you want to delete this patient?')) {
    return;
  }

  this.loading = true;

  this.patientService.deletePatient(id).subscribe({

    next: () => {

      // Remove immediately from UI
      this.patients = this.patients.filter(p => p.id !== id);
      this.filteredPatients = this.filteredPatients.filter(p => p.id !== id);

      // Refresh pagination
      this.updatePagination();

      this.loading = false;

      this.showToast('Patient deleted successfully', 'success');

      // Force Angular UI refresh
      this.cdr.detectChanges();

      // Optional: reload from backend (recommended)
      this.loadPatients();
    },

    error: (err) => {
      console.error(err);
      this.loading = false;
      this.showToast('Failed to delete patient', 'error');
    }

  });

}
  // ==========================================
  // DELETE ALL PATIENTS
  // ==========================================

  deleteAllPatients(): void {

    if (
      this.patients.length === 0
    ) {

      this.showToast(
        'No patients available to delete',
        'warning'
      );

      return;
    }

    const confirmed =
      window.confirm(
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
        (patient: Patient) =>

          this.patientService
            .deletePatient(
              Number(patient.id)
            )
            .pipe(
              catchError(
                (error: any) =>
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

          const failedIds =
            responses
              .filter(
                (response: any) =>
                  response?.failed
              )
              .map(
                (response: any) =>
                  Number(response.id)
              );

          const deletedIds =
            this.patients
              .map(
                (patient: Patient) =>
                  Number(patient.id)
              )
              .filter(
                (id: number) =>
                  !failedIds.includes(id)
              );

          console.log(
            'Delete all responses:',
            responses
          );

          // REMOVE SUCCESSFULLY DELETED
          this.patients =
            this.patients.filter(
              (patient: Patient) =>
                !deletedIds.includes(
                  Number(patient.id)
                )
            );

          this.filteredPatients =
            this.filteredPatients.filter(
              (patient: Patient) =>
                !deletedIds.includes(
                  Number(patient.id)
                )
            );

          this.updatePagination();

          this.showToast(
            failedIds.length === 0
              ? 'All patients deleted successfully'
              : `${deletedIds.length} patients deleted. ${failedIds.length} could not be deleted.`,
            failedIds.length === 0
              ? 'success'
              : 'warning'
          );

          // REFRESH DRAFTS
          this.loadDraftPatients();

          this.cdr.detectChanges();
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
          this.updatePagination();
          this.cdr.detectChanges();
        },

        // ====================================
        // COMPLETE
        // ====================================

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
        (patient: Patient) => ({

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

          if (
            !excelData.length
          ) {

            this.showToast(
              'Excel file is empty',
              'warning'
            );

            return;
          }

          // ==================================
          // CONVERT EXCEL DATA
          // ==================================

          const patients: Patient[] =
            excelData
              .map(
                (row: any) => {

                  const patient: Patient = {

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

                  return patient;
                }
              )

              // REMOVE BLANK ROWS
              .filter(
                (patient: Patient) =>
                  patient.name ||
                  patient.mobile ||
                  patient.email
              );

          // ==================================
          // VALIDATION
          // ==================================

          if (
            patients.length === 0
          ) {

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
              (patient: Patient) =>
                this.patientService
                  .savePatient(patient)
            );

          forkJoin(requests)
            .subscribe({

              // ==============================
              // SUCCESS
              // ==============================

              next: (
                responses: Patient[]
              ) => {

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
          length: this.totalPages
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