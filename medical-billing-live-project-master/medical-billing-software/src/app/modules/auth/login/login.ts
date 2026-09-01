import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {

  loginForm!: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';
  successMessage = '';
  isNotVerified = false;
  unverifiedData: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // ================= FORM =================

  ngOnInit(): void {
    const savedStore = sessionStorage.getItem('signupCompanyName') || '';
    const savedEmail = sessionStorage.getItem('signupEmail') || '';

    this.route.queryParams.subscribe(params => {
      if (params['resetSuccess']) {
        this.successMessage = 'Password reset successfully! Please sign in with your new password.';
      }
    });

    this.loginForm = this.fb.group({
      storeName: [
        savedStore,
        [
          Validators.required
        ]
      ],

      email: [
        savedEmail,
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]

    });

    // Clear error message when user edits any field
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
        this.isNotVerified = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ================= PASSWORD =================

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  goToVerifyOtp(): void {
    this.router.navigate(['/verify-otp'], {
      state: {
        email: this.unverifiedData?.email || this.loginForm.value.email,
        mobile: this.unverifiedData?.mobile || '',
        countryCode: this.unverifiedData?.countryCode || '+91',
        companyName: this.unverifiedData?.companyName || this.loginForm.value.storeName
      }
    });
  }

  // ================= LOGIN =================

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.isNotVerified = false;
    this.cdr.detectChanges();

    const loginRequest = {
      storeName: this.loginForm.value.storeName,
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    console.log('Submitting Login Request:', { email: loginRequest.email, storeName: loginRequest.storeName });

    this.authService
      .login(loginRequest)
      .subscribe({

        next: (response) => {
          this.loading = false;
          console.log('Login Success:', response);
          this.router.navigate(['/dashboard']);
        },

        error: (error) => {
          this.loading = false;
          console.error('Login Failed with error:', error);
          this.isNotVerified = false;

          if (error?.error?.notVerified || (error?.error?.message && error.error.message.toLowerCase().includes('otp'))) {
            this.isNotVerified = true;
            this.unverifiedData = error.error;
            this.errorMessage = error.error.message || 'Your account is not verified yet! Please complete OTP verification to log in.';
          } else if (error?.error?.message) {
            this.errorMessage = error.error.message;
          } else if (typeof error?.error === 'string' && error.error.length > 0 && error.error.length < 200) {
            this.errorMessage = error.error;
          } else if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
            this.errorMessage = 'Invalid username or password. Please check your Store Name, Email, and Password.';
          } else if (error?.status === 0) {
            this.errorMessage = 'Backend server is not reachable. Please start your Spring Boot application on port 8082.';
          } else {
            this.errorMessage = 'Invalid username or password. Please verify your credentials.';
          }

          this.cdr.detectChanges();
        }

      });
  }
}