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
          // FINAL RESULT
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
  // DELETE SINGLE PATIENT
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

        next: (response) => {

          console.log(
            'Patient deleted successfully:',
            response
          );


          this.loadPatients();

        },


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
  // DELETE ALL PATIENTS
  // ==========================================

  deleteAllPatients(): void {

    if (this.patients.length === 0) {

      alert(
        'No patients available to delete'
      );

      return;

    }


    const confirmed =
      confirm(
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


    const deleteRequests =
      this.patients.map(
        (patient: any) =>
          this.patientService
            .deletePatient(patient.id)
      );


    forkJoin(deleteRequests)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (responses) => {

          console.log(
            'All patients deleted successfully:',
            responses
          );


          this.patients = [];

          this.filteredPatients = [];

          this.paginatedPatients = [];


          this.currentPage = 1;

          this.totalPages = 1;

          this.pages = [];

          this.startItem = 0;

          this.endItem = 0;


          this.loading = false;


          this.cdr.detectChanges();


          alert(
            'All patients deleted successfully'
          );

        },


        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'Failed to delete all patients:',
            error
          );


          this.loading = false;


          alert(
            'Failed to delete all patients'
          );


          this.loadPatients();

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
            patient.id || '',

          Name:
            patient.name || '',

          Mobile:
            patient.mobile || '',

          Email:
            patient.email || '',

          'Date of Birth':
            patient.dob || '',

          Gender:
            patient.gender || '',

          'Blood Group':
            patient.bloodGroup || '',

          'Marital Status':
            patient.maritalStatus || '',

          Occupation:
            patient.occupation || '',

          'Aadhaar Number':
            patient.aadhaar || '',

          'PAN Number':
            patient.pan || '',

          'Emergency Contact':
            patient.emergencyContact || '',

          'Emergency Contact Name':
            patient.emergencyName || '',

          'Address 1':
            patient.address1 || '',

          'Address 2':
            patient.address2 || '',

          District:
            patient.district || '',

          City:
            patient.city || '',

          State:
            patient.state || '',

          Country:
            patient.country || 'India',

          Pincode:
            patient.pincode || '',

          'Medical History':
            patient.medicalHistory || '',

          'Current Medication':
            patient.currentMedication || '',

          Allergies:
            patient.allergies || '',

          'Insurance Provider':
            patient.insuranceProvider || '',

          'Policy Number':
            patient.policyNumber || '',

          'Policy Holder Name':
            patient.policyHolderName || ''

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

            alert(
              'Excel file is empty'
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

                    // ==========================
                    // PERSONAL DETAILS
                    // ==========================

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


                    // ==========================
                    // EMERGENCY CONTACT
                    // ==========================

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


                    // ==========================
                    // ADDRESS DETAILS
                    // ==========================

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


                    // ==========================
                    // MEDICAL DETAILS
                    // ==========================

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


                    // ==========================
                    // INSURANCE DETAILS
                    // ==========================

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


              // ==================================
              // REMOVE BLANK ROWS
              // ==================================

              .filter(
                (patient: any) => {

                  return (

                    patient.name ||

                    patient.mobile ||

                    patient.email

                  );

                }
              );


          // ==================================
          // VALIDATION
          // ==================================

          if (
            patients.length === 0
          ) {

            alert(
              'No valid patient data found in Excel.'
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


              // ==============================
              // ERROR
              // ==============================

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


    reader.readAsArrayBuffer(
      file
    );


    // ========================================
    // ALLOW SAME FILE AGAIN
    // ========================================

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
      const header
      of possibleHeaders
    ) {

      const matchingKey =
        rowKeys.find(
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
      const header
      of possibleHeaders
    ) {

      const matchingKey =
        rowKeys.find(
          key =>
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

      return (
        date
          .toISOString()
          .split('T')[0]
      );

    }


    return String(value).trim();

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
      start +
      this.pageSize;


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

  goToPage(
    page: number
  ): void {

    if (
      page >= 1 &&
      page <= this.totalPages
    ) {

      this.currentPage =
        page;

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