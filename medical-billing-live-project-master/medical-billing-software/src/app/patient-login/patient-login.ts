import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-patient-login',
  imports: [ReactiveFormsModule],
  templateUrl: './patient-login.html',
  styleUrl: './patient-login.css',
})
export class PatientLogin implements OnInit {
   patientForm!: FormGroup;
  age = 0;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {

    this.patientForm = this.fb.group({

      patientId: [''],

      patientName: [
        '',
        [
          Validators.required,
          Validators.pattern('^[A-Za-z ]+$'),
          Validators.maxLength(100)
        ]
      ],

      mobile: [
        '',
        [
          Validators.required,
          Validators.pattern('^[6-9][0-9]{9}$')
        ]
      ],

      email: [
        '',
        [
          Validators.email
        ]
      ],

      dob: ['', Validators.required],

      gender: ['', Validators.required],

      address: [''],

      bloodGroup: ['']
    });

  }

  calculateAge() {

    let dob = new Date(this.patientForm.value.dob);

    let today = new Date();

    this.age = today.getFullYear() - dob.getFullYear();

  }

  savePatient() {

    if(this.patientForm.invalid){

      this.patientForm.markAllAsTouched();

      return;

    }

    console.log(this.patientForm.value);

    alert("Patient Registered Successfully");

  }

  resetForm(){

    this.patientForm.reset();

  }

}
