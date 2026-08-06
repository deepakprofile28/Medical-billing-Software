import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppCard } from '../../../../shared/components/app-card/app-card';
@Component({
  selector: 'app-patient-registration',
  imports: [ReactiveFormsModule, CommonModule,
    ReactiveFormsModule],
  templateUrl: './patient-registration.html',
  styleUrl: './patient-registration.css',
})
export class PatientRegistration {
  patientForm!: FormGroup;
  constructor(private fb: FormBuilder) {}
  ngOnInit(): void {

  this.patientForm = this.fb.group({

    name: [''],

    mobile: [''],

    email: [''],

    gender: [''],

    bloodGroup: [''],

    dob: [''],
   
    maritalStatus: [''],

occupation: [''],

aadhaar: [''],
pan: [''],

emergencyContact: [''],
emergencyName: ['']

  });

}
}
