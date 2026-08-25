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
import { forkJoin } from 'rxjs';

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
  // GET ALL PATIENTS
  // ==========================================

  loadPatients(): void {

    this.loading = true;

    console.log(
      'Loading patients...'
    );


    this.patientService
      .getPatients()
      .subscribe({

        // ======================================
        // SUCCESS
        // ======================================

        next: (data) => {

          console.log(
            'Patients API response:',
            data
          );


          this.patients =
            data || [];


          this.filteredPatients =
            [...this.patients];


          // Reset pagination

          this.currentPage = 1;


          this.updatePagination();


          this.loading = false;


          this.cdr.detectChanges();

        },


        // ======================================
        // ERROR
        // ======================================

        error: (error) => {

          console.error(
            'Failed to load patients:',
            error
          );


          this.patients = [];

          this.filteredPatients = [];

          this.paginatedPatients = [];


          this.loading = false;


          this.updatePagination();


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
        (patient: any) => {


          // ====================================
          // SEARCH
          // ====================================

          const matchesSearch =

            !search ||

            String(patient.id || '')
              .toLowerCase()
              .includes(search) ||

            String(patient.name || '')
              .toLowerCase()
              .includes(search) ||

            String(patient.mobile || '')
              .toLowerCase()
              .includes(search) ||

            String(patient.email || '')
              .toLowerCase()
              .includes(search) ||

            String(patient.city || '')
              .toLowerCase()
              .includes(search) ||

            String(patient.state || '')
              .toLowerCase()
              .includes(search);


          // ====================================
          // GENDER
          // ====================================

          const matchesGender =

            !this.selectedGender ||

            String(patient.gender || '')
              .toLowerCase() ===
            this.selectedGender
              .toLowerCase();


          // ====================================
          // BLOOD GROUP
          // ====================================

          const matchesBloodGroup =

            !this.selectedBloodGroup ||

            String(patient.bloodGroup || '')
              .toLowerCase() ===
            this.selectedBloodGroup
              .toLowerCase();


          // ====================================
          // FINAL
          // ====================================

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


    // Reset to first page

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


    this.filteredPatients =
      [...this.patients];


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
  // EDIT PATIENT
  // ==========================================

  editPatient(patient: any): void {

    if (!patient?.id) {

      alert(
        'Patient ID not found'
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
  // DELETE PATIENT
  // ==========================================

  deletePatient(id: number): void {

    if (!id) {

      alert(
        'Patient ID not found'
      );

      return;

    }


    const confirmed =
      confirm(
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

        next: (response) => {

          console.log(
            'Patient deleted successfully:',
            response
          );


          this.loadPatients();

        },


        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'Failed to delete patient:',
            error
          );


          alert(
            'Failed to delete patient'
          );

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

          ID: patient.id || '',

          Name: patient.name || '',

          Mobile: patient.mobile || '',

          Email: patient.email || '',

          Gender: patient.gender || '',

          'Blood Group':
            patient.bloodGroup || '',

          City: patient.city || '',

          State: patient.state || ''

        })
      );


    // ========================================
    // NO DATA
    // ========================================

    if (data.length === 0) {

      alert(
        'No patient data available to download'
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

  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = (e: any) => {

    try {

      const data = new Uint8Array(e.target.result);

      const workbook = XLSX.read(data, {
        type: 'array'
      });

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const excelData: any[] =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: ''
          }
        );

      console.log('Raw Excel Data:', excelData);

      // ======================================
      // EMPTY EXCEL CHECK
      // ======================================

      if (!excelData.length) {

        alert('Excel file is empty');

        return;
      }

      // ======================================
      // SHOW EXCEL HEADERS
      // ======================================

      console.log(
        'Excel Headers:',
        Object.keys(excelData[0])
      );


      // ======================================
      // CONVERT EXCEL DATA
      // ======================================

      const patients = excelData
        .map((row: any) => {

          const patient = {

            name: this.getExcelValue(
              row,
              ['Name', 'NAME', 'Patient Name', 'patientName']
            ),

            mobile: this.getExcelValue(
              row,
              ['Mobile', 'MOBILE', 'Mobile Number', 'Phone']
            ),

            email: this.getExcelValue(
              row,
              ['Email', 'EMAIL', 'Email Address']
            ),

            gender: this.getExcelValue(
              row,
              ['Gender', 'GENDER']
            ),

            bloodGroup: this.getExcelValue(
              row,
              ['Blood Group', 'BloodGroup', 'BLOOD GROUP']
            ),

            city: this.getExcelValue(
              row,
              ['City', 'CITY']
            ),

            state: this.getExcelValue(
              row,
              ['State', 'STATE']
            )

          };

          console.log(
            'Converted Patient:',
            patient
          );

          return patient;

        })
        .filter((patient: any) => {

          // Don't save completely blank rows
          return (
            patient.name ||
            patient.mobile ||
            patient.email
          );

        });


      // ======================================
      // VALIDATION
      // ======================================

      if (patients.length === 0) {

        alert(
          'No valid patient data found in Excel.'
        );

        return;
      }


      console.log(
        'Patients ready for upload:',
        patients
      );


      // ======================================
      // SAVE PATIENTS
      // ======================================

      this.loading = true;

      const requests = patients.map(
        (patient: any) =>
          this.patientService.savePatient(patient)
      );


      forkJoin(requests).subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (responses) => {

          console.log(
            'Imported successfully:',
            responses
          );

          this.loading = false;

          alert(
            `${patients.length} patients imported successfully`
          );

          // Refresh list
          this.loadPatients();

        },


        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'Excel import API failed:',
            error
          );

          this.loading = false;

          alert(
            'Failed to import patients'
          );

        }

      });

    }

    catch (error) {

      console.error(
        'Excel processing error:',
        error
      );

      this.loading = false;

      alert(
        'Invalid Excel file'
      );

    }

  };


  reader.readAsArrayBuffer(file);

  // Allow same file selection again
  event.target.value = '';

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


    if (this.totalPages === 0) {

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

    }

    else {

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

  goToPage(page: number): void {

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
  // ==========================================
// GET EXCEL VALUE
// ==========================================

private getExcelValue(
  row: any,
  possibleHeaders: string[]
): string {

  const rowKeys = Object.keys(row);

  for (const header of possibleHeaders) {

    const matchingKey = rowKeys.find(
      key =>
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

}