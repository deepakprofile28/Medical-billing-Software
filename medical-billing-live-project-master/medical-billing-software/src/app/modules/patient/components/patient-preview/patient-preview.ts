import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-preview',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './patient-preview.html',
  styleUrls: ['./patient-preview.css'],
})
export class PatientPreview {

  @Input() patientForm!: FormGroup;

  patientAge = 0;
  completion = 0;
  currentAddressStep = 0;
  maxAddressSteps = 6;

  nextAddressDetail(): void {
    if (this.currentAddressStep < this.maxAddressSteps - 1) {
      this.currentAddressStep++;
    }
  }

  prevAddressDetail(): void {
    if (this.currentAddressStep > 0) {
      this.currentAddressStep--;
    }
  }
}
