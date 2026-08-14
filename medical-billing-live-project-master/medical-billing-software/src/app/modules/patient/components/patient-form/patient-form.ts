import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './patient-form.html',
  styleUrls: ['./patient-form.css']
})
export class PatientForm {

  @Input() patientForm!: FormGroup;
  @Output() nextStep = new EventEmitter<void>();

  onNext(): void {
    if (this.patientForm.valid) {
      this.nextStep.emit();
    }
  }
}