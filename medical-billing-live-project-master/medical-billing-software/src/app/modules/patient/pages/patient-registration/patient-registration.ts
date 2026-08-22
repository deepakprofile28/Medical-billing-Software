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
import { Router } from '@angular/router';

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

  // ==========================================
  // STEP
  // ==========================================

  currentStep = 1;
  patientAge = 0;
  patientForm: FormGroup;


  // ==========================================
  // TOAST
  // ==========================================

  showToastMessage = '';
  showToastType: 'success' | 'error' = 'success';
  showToastVisible = false;


  // ==========================================
  // PREVIEW CAROUSEL
  // ==========================================

  previewIndex = 0;
  totalPreviews = 5;

  @ViewChild('previewPanel', { static: false })
  previewPanel!: ElementRef<HTMLElement>;


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
      private router: Router

  ) {

    this.patientForm = this.fb.group({

      // ======================================
      // PERSONAL DETAILS
      // ======================================

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


      // ======================================
      // ADDRESS DETAILS
      // ======================================

      address1: [''],
      address2: [''],
      district: [''],
      city: [''],
      state: [''],
      country: ['India'],
      pincode: [''],


      // ======================================
      // MEDICAL DETAILS
      // ======================================

      medicalHistory: [''],
      currentMedication: [''],
      allergies: [''],


      // ======================================
      // INSURANCE DETAILS
      // ======================================

      insuranceProvider: [''],
      policyNumber: [''],
      policyHolderName: ['']
    });
  }


  // ==========================================
  // AFTER VIEW INIT
  // ==========================================

  ngAfterViewInit(): void {

    setTimeout(() => {
      this.scrollToPreview(this.previewIndex);
    }, 0);
  }


  // ==========================================
  // TOAST
  // ==========================================

  showToast(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.showToastMessage = message;
    this.showToastType = type;
    this.showToastVisible = true;
  }


  closeToast(): void {
    this.showToastVisible = false;
  }


  // ==========================================
  // PREVIEW CAROUSEL
  // ==========================================

  goToPreview(index: number): void {

    if (index < 0) {
      index = 0;
    }

    if (index >= this.totalPreviews) {
      index = this.totalPreviews - 1;
    }

    this.previewIndex = index;

    this.scrollToPreview(index);
  }


  nextPreview(): void {

    const next = Math.min(
      this.previewIndex + 1,
      this.totalPreviews - 1
    );

    this.goToPreview(next);
  }


  prevPreview(): void {

    const previous = Math.max(
      this.previewIndex - 1,
      0
    );

    this.goToPreview(previous);
  }


  private scrollToPreview(index: number): void {

    try {

      const panel = this.previewPanel?.nativeElement;

      if (!panel) {
        return;
      }

      const slideWidth = panel.clientWidth;

      panel.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });

    } catch (error) {

      console.warn(
        'Preview scroll failed:',
        error
      );
    }
  }


  // ==========================================
  // NEXT STEP
  // ==========================================

  nextStep(): void {

    if (this.currentStep < 5) {

      this.currentStep++;

      // Move preview carousel
      this.goToPreview(
        this.currentStep - 1
      );

    } else {

      // Step 5 = Save
      this.savePatient();
    }
  }


  // ==========================================
  // PREVIOUS STEP
  // ==========================================

  previousStep(): void {

    if (this.currentStep > 1) {

      this.currentStep--;

      // Move preview carousel
      this.goToPreview(
        this.currentStep - 1
      );
    }
  }


  // ==========================================
  // SAVE PATIENT
  // ==========================================

  savePatient(): void {

    const patientData =
      this.patientForm.getRawValue();

    console.log(
      'Patient data to save:',
      patientData
    );

    this.patientService
      .savePatient(patientData)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (response) => {

          console.log(
            'Patient saved successfully',
            response
          );

          // Show success toast
          this.showToast(
            'Patient saved successfully',
            'success'
          );


          // Reset form after successful save

          this.patientForm.reset({
            country: 'India'
          });


          // Go back to Step 1

          this.currentStep = 1;


          // Reset preview

          this.previewIndex = 0;

  this.router.navigate(['/patients']);
        },


        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'Patient save failed',
            error
          );

          // Show error toast
          this.showToast(
            'Failed to save patient',
            'error'
          );
        }
      });
  }
}