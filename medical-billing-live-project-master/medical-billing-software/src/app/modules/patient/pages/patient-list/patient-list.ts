import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { PatientService } from '../../services/patient.service';

import { Router } from '@angular/router';


@Component({
  selector: 'app-patient-list',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './patient-list.html',

  styleUrl: './patient-list.css'
})


export class PatientList implements OnInit {

  patients: any[] = [];

  loading = false;


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

        // ====================================
        // SUCCESS
        // ====================================

        next: (data) => {

          console.log(
            'Patients API response:',
            data
          );


          this.patients = data || [];


          console.log(
            'Patients loaded:',
            this.patients
          );


          this.loading = false;


          // Force UI refresh
          this.cdr.detectChanges();

        },


        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'Failed to load patients:',
            error
          );


          this.patients = [];

          this.loading = false;


          this.cdr.detectChanges();

        }

      });

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
  // EDIT
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
  // DELETE
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


          // Reload patient list
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

}