import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { PatientForm } from '../../components/patient-form/patient-form';

import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient-registration',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    PatientForm
  ],

  templateUrl: './patient-registration.html',

  styleUrl: './patient-registration.css'
})
export class PatientRegistration implements AfterViewInit {

  // ===============================
  // STEP
  // ===============================

  currentStep = 1;

  patientAge = 0;

  patientForm: FormGroup;


  // ===============================
  // PREVIEW CAROUSEL
  // ===============================

  previewIndex = 0;

  totalPreviews = 5;

  @ViewChild('previewPanel', { static: false })
  previewPanel!: ElementRef<HTMLElement>;


  // ===============================
  // CONSTRUCTOR
  // ===============================

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService
  ) {

    this.patientForm = this.fb.group({

      // =================================
      // PERSONAL DETAILS
      // =================================

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


      // =================================
      // ADDRESS DETAILS
      // =================================

      address1: [''],

      address2: [''],

      district: [''],

      city: [''],

      state: [''],

      country: ['India'],

      pincode: [''],


      // =================================
      // MEDICAL DETAILS
      // =================================

      medicalHistory: [''],

      currentMedication: [''],

      allergies: [''],


      // =================================
      // INSURANCE DETAILS
      // =================================

      insuranceProvider: [''],

      policyNumber: [''],

      policyHolderName: ['']

    });
  }


  // ===============================
  // AFTER VIEW INIT
  // ===============================

  ngAfterViewInit(): void {

    setTimeout(() => {

      this.scrollToPreview(this.previewIndex);

    }, 0);

  }


  // ===============================
  // PREVIEW CAROUSEL
  // ===============================

  goToPreview(i: number): void {

    if (i < 0) {

      i = 0;

    }

    if (i >= this.totalPreviews) {

      i = this.totalPreviews - 1;

    }

    this.previewIndex = i;

    this.scrollToPreview(i);

  }


  nextPreview(): void {

    const next = Math.min(
      this.previewIndex + 1,
      this.totalPreviews - 1
    );

    this.goToPreview(next);

  }


  prevPreview(): void {

    const prev = Math.max(
      this.previewIndex - 1,
      0
    );

    this.goToPreview(prev);

  }


  private scrollToPreview(i: number): void {

    try {

      const panel = this.previewPanel?.nativeElement;

      if (!panel) {

        return;

      }

      const slideWidth = panel.clientWidth;

      panel.scrollTo({

        left: i * slideWidth,

        behavior: 'smooth'

      });

    } catch (error) {

      console.warn(
        'Preview scroll failed',
        error
      );

    }

  }


  // ===============================
  // NEXT STEP
  // ===============================

  nextStep(): void {

    if (this.currentStep < 5) {

      this.currentStep++;

      // Move preview to next slide
      this.goToPreview(
        this.currentStep - 1
      );

    } else {

      // Step 5 → Save Patient
      this.savePatient();

    }

  }


  // ===============================
  // PREVIOUS STEP
  // ===============================

  previousStep(): void {

    if (this.currentStep > 1) {

      this.currentStep--;

      // Move preview to previous slide
      this.goToPreview(
        this.currentStep - 1
      );

    }

  }


  // ===============================
  // SAVE PATIENT
  // ===============================

  savePatient(): void {

    // Get complete form data
    const patientData = this.patientForm.getRawValue();

    console.log(
      'Patient data to save:',
      patientData
    );


    // Call Spring Boot API
    this.patientService
      .savePatient(patientData)
      .subscribe({

        // ===============================
        // SUCCESS
        // ===============================

        next: (response) => {

          console.log(
            'Patient saved successfully:',
            response
          );

          alert(
            'Patient saved successfully'
          );


          // Reset form
          this.patientForm.reset({

            country: 'India'

          });


          // Go back to Step 1
          this.currentStep = 1;

          this.previewIndex = 0;

          this.goToPreview(0);

        },


        // ===============================
        // ERROR
        // ===============================

        error: (error) => {

          console.error(
            'Patient save failed:',
            error
          );

          alert(
            'Failed to save patient. Please try again.'
          );

        }

      });

  }

}