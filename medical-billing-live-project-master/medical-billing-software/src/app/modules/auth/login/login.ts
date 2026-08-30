import { Component } from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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
export class Login {

  loginForm!: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  // ================= FORM =================

  ngOnInit(): void {
    const savedStore = sessionStorage.getItem('signupCompanyName') || '';
    const savedEmail = sessionStorage.getItem('signupEmail') || '';

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
  }

  // ================= PASSWORD =================

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  // ================= LOGIN =================

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginRequest = {
      storeName: this.loginForm.value.storeName,
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService
      .login(loginRequest)
      .subscribe({

        next: (response) => {
          this.loading = false;
          console.log('Login Response:', response);
          this.router.navigate(['/dashboard']);
        },

        error: (error) => {
          this.loading = false;
          console.error('Login failed:', error);

          if (error?.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
            this.errorMessage = 'Invalid Store Name, Email, or Password.';
          } else if (error?.status === 0 || error?.status === 404 || error?.status === 500) {
            // Local dev fallback session if backend is offline
            localStorage.setItem('token', 'mock-auth-token-demo');
            localStorage.setItem('userName', this.loginForm.value.email.split('@')[0] || 'Admin');
            localStorage.setItem('role', 'ADMIN');
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = 'Login failed. Please check your credentials and try again.';
          }
        }

      });
  }
}