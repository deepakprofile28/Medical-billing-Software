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

  patients: any[] = [];
  filteredPatients: any[] = [];

  loading = false;

  // Search
  searchText = '';

  // Filters
  selectedGender = '';
  selectedBloodGroup = '';

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  // ==========================================
  // ON INIT
  // ==========================================

  ngOnInit(): void {
    console.log('PatientList component initialized');

    this.loadPatients();
  }

  // ==========================================
  // GET ALL PATIENTS
  // ==========================================

  loadPatients(): void {

    this.loading = true;

    this.patientService.getPatients().subscribe({

      next: (data) => {

        console.log('Patients API response:', data);

        this.patients = data || [];

        // Initially show all patients
        this.filteredPatients = [...this.patients];

        this.loading = false;

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error(
          'Failed to load patients:',
          error
        );

        this.patients = [];
        this.filteredPatients = [];

        this.loading = false;

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
      this.patients.filter((patient: any) => {

        // ======================================
        // SEARCH
        // ======================================

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


        // ======================================
        // GENDER FILTER
        // ======================================

        const matchesGender =

          !this.selectedGender ||

          String(patient.gender || '')
            .toLowerCase() ===
          this.selectedGender.toLowerCase();


        // ======================================
        // BLOOD GROUP FILTER
        // ======================================

        const matchesBloodGroup =

          !this.selectedBloodGroup ||

          String(patient.bloodGroup || '')
            .toLowerCase() ===
          this.selectedBloodGroup.toLowerCase();


        // ======================================
        // FINAL RESULT
        // ======================================

        return (
          matchesSearch &&
          matchesGender &&
          matchesBloodGroup
        );

      });

    console.log(
      'Filtered Patients:',
      this.filteredPatients
    );
  }

  // ==========================================
  // CLEAR FILTER
  // ==========================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedGender = '';

    this.selectedBloodGroup = '';

    this.filteredPatients = [
      ...this.patients
    ];

  }

  // ==========================================
  // ADD NEW PATIENT
  // ==========================================

  addNewPatient(): void {

    this.router.navigate([
      '/patient-registration'
    ]);

  }

  // ==========================================
  // EDIT
  // ==========================================

  editPatient(patient: any): void {

    if (!patient?.id) {

      alert('Patient ID not found');

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
  // DELETE
  // ==========================================

  deletePatient(id: number): void {

    if (!id) {

      alert('Patient ID not found');

      return;
    }

    const confirmed =
      confirm(
        'Are you sure you want to delete this patient?'
      );

    if (!confirmed) {
      return;
    }

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
// DOWNLOAD PATIENTS EXCEL
// ==========================================

downloadExcel(): void {

  const data = this.filteredPatients.map((patient: any) => ({

    ID: patient.id || '',
    Name: patient.name || '',
    Mobile: patient.mobile || '',
    Email: patient.email || '',
    Gender: patient.gender || '',
    'Blood Group': patient.bloodGroup || '',
    City: patient.city || '',
    State: patient.state || ''

  }));

  // No data check
  if (data.length === 0) {

    alert('No patient data available to download');

    return;
  }

  // Create worksheet
  const worksheet: XLSX.WorkSheet =
    XLSX.utils.json_to_sheet(data);

  // Create workbook
  const workbook: XLSX.WorkBook =
    XLSX.utils.book_new();

  // Add worksheet
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Patients'
  );

  // Download Excel
  XLSX.writeFile(
    workbook,
    'Patient_List.xlsx'
  );

}

}