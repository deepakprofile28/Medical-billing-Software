import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

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

  readonly roles = [
    {
      value: 'PHARMACIST',
      label: 'Pharmacist / Pharmacy Staff'
    },
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
    this.cdr.detectChanges();

    const val = this.signupForm.value;

    const companyRequest: CompanyRegistrationRequest = {
      companyName: val.companyName,
      businessPhone: val.mobile,
      businessEmail: val.email,
      countryCode: '+91',
      mobile: val.mobile,
      address: '',
      ownerName: val.userName,
      ownerEmail: val.email,
      ownerMobile: val.mobile,
      ownerCountryCode: '+91',
      password: val.password,
      status: 'TRIAL',
      plan: 1
    };

    console.log('Registering Staff/Pharmacy Account:', companyRequest);

    this.authService.registerCompany(companyRequest).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Pharmacy registered successfully! Redirecting to OTP verification...';
        this.cdr.detectChanges();

        sessionStorage.setItem('signupEmail', val.email);
        sessionStorage.setItem('signupMobile', val.mobile);
        sessionStorage.setItem('signupCountryCode', '+91');
        sessionStorage.setItem('signupUserName', val.userName);
        sessionStorage.setItem('signupCompanyName', val.companyName);
        sessionStorage.setItem('signupRole', 'PHARMACIST');

        const companyId = response?.company?.id || response?.companyId || response?.id;
        if (companyId) {
          sessionStorage.setItem('signupCompanyId', companyId.toString());
        }

        setTimeout(() => {
          this.router.navigate(['/verify-otp'], {
            state: {
              email: val.email,
              mobile: val.mobile,
              countryCode: '+91',
              userName: val.userName,
              companyName: val.companyName,
              companyId: companyId,
              role: 'PHARMACIST'
            }
          });
        }, 500);
      },

      error: (err) => {
        this.loading = false;
        console.error('Registration failed:', err);

        this.errorMessage =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Registration failed. Please check your details and try again.';

        this.cdr.detectChanges();
      }
    });
  }
}