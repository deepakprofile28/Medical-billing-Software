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
  activeStoreName = '';
  activeStoreId = '';

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
    },
    {
      value: 'ADMIN',
      label: 'Store Administrator / Co-Admin'
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
    this.activeStoreName = localStorage.getItem('companyName') || 'Apollo';
    this.activeStoreId = localStorage.getItem('companyId') || '6';

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
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({
        passwordMismatch: true
      });
      return { passwordMismatch: true };
    }
    return null;
  }

  // =====================================================
  // PASSWORD TOGGLE
  // =====================================================

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  // =====================================================
  // CONFIRM PASSWORD TOGGLE
  // =====================================================

  toggleConfirmPassword(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const val = this.signupForm.value;
    const currentCompanyId = localStorage.getItem('companyId') || this.activeStoreId;
    const currentCompanyName = localStorage.getItem('companyName') || this.activeStoreName || 'Apollo';
    const isLoggedIn = !!localStorage.getItem('token');

    // STAFF REGISTRATION (LINK DIRECTLY TO CURRENT STORE COMPANY ID)
    const staffPayload: SignupRequest = {
      name: val.userName,
      userName: val.userName,
      email: val.email.trim().toLowerCase(),
      password: val.password,
      mobile: val.mobile ? val.mobile.replace(/\D/g, '') : '',
      countryCode: '+91',
      role: val.role || 'PHARMACIST',
      companyId: currentCompanyId ? Number(currentCompanyId) : undefined,
      companyName: currentCompanyName,
      active: true,
      status: 'Active'
    };

    console.log('Registering Staff Member for Store:', staffPayload);

    this.authService.registerUser(staffPayload).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = `Staff member '${val.userName}' registered successfully for ${currentCompanyName}!`;
        this.cdr.detectChanges();

        setTimeout(() => {
          if (isLoggedIn) {
            this.router.navigate(['/users']);
          } else {
            this.router.navigate(['/login']);
          }
        }, 1200);
      },
      error: (err) => {
        this.loading = false;
        console.error('Staff registration failed:', err);
        this.errorMessage =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Staff registration failed. Please check your details and try again.';
        this.cdr.detectChanges();
      }
    });
  }
}