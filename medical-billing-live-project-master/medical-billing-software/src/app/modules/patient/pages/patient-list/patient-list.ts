import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css'
})
export class PatientList implements OnInit {

  patients: any[] = [];
  loading = false;

  constructor(
    private patientService: PatientService
  ) {}

  // ============================
  // ON INIT
  // ============================

  ngOnInit(): void {
    this.loadPatients();
  }


  // ============================
  // GET ALL PATIENTS
  // ============================

  loadPatients(): void {

    this.loading = true;

    console.log('Loading patients...');

    this.patientService.getPatients().subscribe({

      next: (data: any[]) => {

        console.log('API DATA:', data);
        console.log('DATA LENGTH:', data?.length);

        this.patients = Array.isArray(data)
          ? data
          : [];

        this.loading = false;

        console.log(
          'Patients after loading:',
          this.patients
        );
      },

      error: (error) => {

        console.error(
          'Failed to load patients:',
          error
        );

        this.patients = [];
        this.loading = false;

      }

    });
  }


  // ============================
  // EDIT
  // ============================

  editPatient(patient: any): void {

    console.log('Edit Patient:', patient);

    alert(
      'Edit Patient: ' +
      (patient.name || 'Patient')
    );

  }


  // ============================
  // DELETE
  // ============================

  deletePatient(id: number): void {

    console.log('Delete Patient ID:', id);

    if (!id) {

      alert('Patient ID not found');

      return;
    }


    // Confirmation popup

    const confirmed = confirm(
      'Are you sure you want to delete this patient?'
    );

    if (!confirmed) {
      return;
    }


    this.loading = true;


    // Delete API

    this.patientService
      .deletePatient(id)
      .subscribe({

        // ============================
        // SUCCESS
        // ============================

        next: () => {

          console.log(
            'Patient deleted successfully'
          );


          // Remove only deleted patient

          this.patients =
            this.patients.filter(
              patient => patient.id !== id
            );


          this.loading = false;


          alert(
            'Patient deleted successfully'
          );

        },


        // ============================
        // ERROR
        // ============================

        error: (error) => {

          console.error(
            'Patient delete failed:',
            error
          );

          this.loading = false;

          alert(
            'Failed to delete patient'
          );

        }

      });

  }

}