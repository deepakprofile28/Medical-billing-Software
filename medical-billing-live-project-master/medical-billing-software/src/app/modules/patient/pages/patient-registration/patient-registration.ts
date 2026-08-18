import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PatientForm } from '../../components/patient-form/patient-form';
// path உங்க project structure-க்கு ஏற்ற மாதிரி change பண்ணுங்க

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

  currentStep = 1;

  patientAge = 0;

  patientForm: FormGroup;

  // Carousel state
  previewIndex = 0;
  totalPreviews = 5;

  @ViewChild('previewPanel', { static: false }) previewPanel!: ElementRef<HTMLElement>;

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

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToPreview(this.previewIndex), 0);
  }

  // Carousel controls
  goToPreview(i: number): void {
    if (i < 0) i = 0;
    if (i >= this.totalPreviews) i = this.totalPreviews - 1;
    this.previewIndex = i;
    this.scrollToPreview(i);
  }

  nextPreview(): void {
    const next = Math.min(this.previewIndex + 1, this.totalPreviews - 1);
    this.goToPreview(next);
  }

  prevPreview(): void {
    const prev = Math.max(this.previewIndex - 1, 0);
    this.goToPreview(prev);
  }

  private scrollToPreview(i: number): void {
    try {
      const panel = this.previewPanel?.nativeElement;
      if (!panel) return;
      const slideWidth = panel.clientWidth;
      panel.scrollTo({ left: i * slideWidth, behavior: 'smooth' });
    } catch (e) {
      console.warn('Preview scroll failed', e);
    }
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