import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { PatientService } from '../../../services/patient.service';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './patient-details.html',
  styleUrl: './patient-details.css'
})
export class PatientDetails implements OnInit {

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
    private cdr: ChangeDetectorRef
  ) {}

  // ==========================================
  // ON INIT
  // ==========================================

  ngOnInit(): void {

    console.log(
      'PatientDetails component initialized'
    );

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

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  editPatient(): void {

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
}