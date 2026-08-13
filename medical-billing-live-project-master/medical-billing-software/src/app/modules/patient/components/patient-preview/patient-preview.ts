import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-preview',
  imports: [ReactiveFormsModule],
  templateUrl: './patient-preview.html',
  styleUrls: ['./patient-preview.css'],
})
export class PatientPreview {

   @Input() patientForm!: FormGroup;

  patientAge = 0;

  completion = 0;
}
