import { Component } from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',

  imports: [
    ReactiveFormsModule
  ],

  templateUrl: './login.html',

  styleUrls: ['./login.css']
})
export class Login {

  loginForm!: FormGroup;

  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  // ================= FORM =================

  ngOnInit(): void {

    this.loginForm = this.fb.group({

      email: [
        '',
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

    this.hidePassword =
      !this.hidePassword;
  }

  // ================= LOGIN =================

  onSubmit(): void {

    // Validate form

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;
    }

    // ================= LOGIN REQUEST =================

    const loginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    console.log(
      'Login Request:',
      loginRequest
    );

    // ================= CALL AUTH SERVICE =================

    this.authService
      .login(loginRequest)
      .subscribe({

        // ================= SUCCESS =================

        next: (response) => {

          console.log(
            'Login Response:',
            response
          );

          // Verify Local Storage

          console.log(
            'Token:',
            localStorage.getItem('token')
          );

          console.log(
            'Company ID:',
            localStorage.getItem('companyId')
          );

          console.log(
            'Company Name:',
            localStorage.getItem('companyName')
          );

          // ================= NAVIGATE =================

          this.router.navigate([
            '/patients'
          ]);
        },

        // ================= ERROR =================

        error: (error) => {

          console.error(
            'Login failed:',
            error
          );

        }

      });
  }
}