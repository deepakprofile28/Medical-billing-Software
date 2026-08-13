import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PatientForm } from '../../components/patient-form/patient-form';
// path உங்க project structure-க்கு ஏற்ற மாதிரி change பண்ணுங்க

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PatientForm
  ],
  templateUrl: './patient-registration.html',
  styleUrl: './patient-registration.css'
})
export class PatientRegistration {

  currentStep = 1;

  patientAge = 0;

  patientForm: FormGroup;

  constructor(private fb: FormBuilder) {

    this.patientForm = this.fb.group({

      // Personal
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

      // Address
      address1: [''],
      address2: [''],
      city: [''],
      state: [''],
      country: ['India'],
      pincode: ['']

    });

  }


  nextStep(): void {

    if (this.currentStep < 5) {

      this.currentStep++;

    } else {

      this.savePatient();

    }

  }


  previousStep(): void {

    if (this.currentStep > 1) {

      this.currentStep--;

    }

  }


  savePatient(): void {

    console.log('Patient Data:', this.patientForm.value);

  }

}