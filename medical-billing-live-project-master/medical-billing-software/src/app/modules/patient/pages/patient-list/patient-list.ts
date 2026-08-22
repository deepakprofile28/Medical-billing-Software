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

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {

    this.loading = true;

    this.patientService.getPatients().subscribe({

      next: (response: any) => {

        console.log('GET PATIENTS RESPONSE:', response);

        this.patients = response;

        console.log('PATIENT ARRAY:', this.patients);

        this.loading = false;
      },

      error: (error) => {

        console.error('GET PATIENTS ERROR:', error);

        this.loading = false;
      }

    });
  }
}