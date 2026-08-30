import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import {
  AuthService,
  SignupRequest,
  CompanyRegistrationRequest
} from '../../services/auth.service';


@Component({
  selector: 'app-signup',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],

  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements OnInit {

  signupForm!: FormGroup;

  hidePassword = true;

  hideConfirmPassword = true;

  loading = false;

  errorMessage = '';

  successMessage = '';


  // =====================================================
  // ROLES
  // =====================================================

  readonly roles = [

    {
      value: 'PHARMACIST',
      label: 'Pharmacy Billing'
    },

    // Future use

    {
      value: 'BILLING_OFFICER',
      label: 'Medical Billing Specialist'
    },

    {
      value: 'DOCTOR',
      label: 'Doctor / Physician'
    },

    {
      value: 'RECEPTIONIST',
      label: 'Front Desk / Receptionist'
    }

  ];


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private fb: FormBuilder,

    private router: Router,

    private authService: AuthService

  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.signupForm = this.fb.group(

      {

        userName: [
          '',
          [
            Validators.required,
            Validators.minLength(3)
          ]
        ],


        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],


        mobile: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[0-9]{10}$/)
          ]
        ],


        companyName: [
          '',
          [
            Validators.required
          ]
        ],


        role: [
          'PHARMACIST',
          [
            Validators.required
          ]
        ],


        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6)
          ]
        ],


        confirmPassword: [
          '',
          [
            Validators.required
          ]
        ],


        agreeTerms: [
          false,
          [
            Validators.requiredTrue
          ]
        ]

      },

      {
        validators: this.passwordMatchValidator
      }

    );

  }


  // =====================================================
  // PASSWORD MATCH VALIDATOR
  // =====================================================

  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const password =
      control.get('password')?.value;

    const confirmPassword =
      control.get('confirmPassword')?.value;


    if (
      password &&
      confirmPassword &&
      password !== confirmPassword
    ) {

      control
        .get('confirmPassword')
        ?.setErrors({
          passwordMismatch: true
        });

      return {
        passwordMismatch: true
      };

    }


    return null;
  }


  // =====================================================
  // PASSWORD TOGGLE
  // =====================================================

  togglePassword(): void {

    this.hidePassword =
      !this.hidePassword;

  }


  // =====================================================
  // CONFIRM PASSWORD TOGGLE
  // =====================================================

  toggleConfirmPassword(): void {

    this.hideConfirmPassword =
      !this.hideConfirmPassword;

  }


  // =====================================================
  // SUBMIT
  // =====================================================

  onSubmit(): void {

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (this.signupForm.invalid) {

      this.signupForm.markAllAsTouched();

      return;
    }


    this.loading = true;

    this.errorMessage = '';

    this.successMessage = '';


    const val =
      this.signupForm.value;


    // ===================================================
    // STEP 1
    // CREATE COMPANY REQUEST
    // ===================================================

    const companyRequest:
      CompanyRegistrationRequest = {

      companyName:
        val.companyName,

      businessPhone:
        val.mobile,

      businessEmail:
        val.email,

      countryCode:
        '+91',

      mobile:
        val.mobile,

      address:
        '',

      ownerName:
        val.userName,

      ownerEmail:
        val.email,

      ownerMobile:
        val.mobile,

      ownerCountryCode:
        '+91',

      password:
        val.password,

      status:
        'TRIAL',

      plan:
        1

    };


    console.log(
      '======================================'
    );

    console.log(
      'PHARMACY REGISTRATION'
    );

    console.log(
      'STEP 1 - COMPANY REQUEST:',
      companyRequest
    );

    console.log(
      '======================================'
    );


    // ===================================================
    // STEP 1 + STEP 2
    // COMPANY CREATE → REGISTER → OTP
    // ===================================================

    this.authService
      .registerCompany(companyRequest)
      .subscribe({

        // =================================================
        // SUCCESS
        // =================================================

        next: (response) => {

          console.log(
            '======================================'
          );

          console.log(
            'REGISTRATION SUCCESS'
          );

          console.log(
            'COMPLETE RESPONSE:',
            response
          );

          console.log(
            '======================================'
          );


          this.loading = false;


          this.successMessage =
            'Pharmacy registered successfully! OTP sent to your mobile.';


          // =================================================
          // SAVE TEMP REGISTRATION DATA
          // =================================================

          sessionStorage.setItem(
            'signupEmail',
            val.email
          );


          sessionStorage.setItem(
            'signupMobile',
            val.mobile
          );


          sessionStorage.setItem(
            'signupCountryCode',
            '+91'
          );


          sessionStorage.setItem(
            'signupUserName',
            val.userName
          );


          sessionStorage.setItem(
            'signupCompanyName',
            val.companyName
          );


          sessionStorage.setItem(
            'signupRole',
            'PHARMACIST'
          );


          // =================================================
          // COMPANY ID
          // =================================================

          const companyId =
            response?.company?.id;


          if (companyId) {

            sessionStorage.setItem(
              'signupCompanyId',
              companyId.toString()
            );

          }


          // =================================================
          // GO TO OTP PAGE
          // =================================================

          setTimeout(() => {

            this.router.navigate(
              ['/verify-otp'],

              {

                state: {

                  email:
                    val.email,

                  mobile:
                    val.mobile,

                  countryCode:
                    '+91',

                  userName:
                    val.userName,

                  companyName:
                    val.companyName,

                  companyId:
                    companyId,

                  role:
                    'PHARMACIST'

                }

              }

            );

          }, 500);

        },


        // =================================================
        // ERROR
        // =================================================

        error: (err) => {

          this.loading = false;


          console.error(
            '======================================'
          );

          console.error(
            'REGISTRATION ERROR:',
            err
          );

          console.error(
            'ERROR BODY:',
            err?.error
          );

          console.error(
            'STATUS:',
            err?.status
          );

          console.error(
            '======================================'
          );


          this.errorMessage =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Registration failed. Please try again.';

        }

      });

  }

}