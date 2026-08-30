import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-verify-otp',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],

  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css'
})
export class VerifyOtp implements OnInit {

  // =====================================================
  // OTP FORM
  // =====================================================

  otpForm!: FormGroup;


  // =====================================================
  // PAGE DATA
  // =====================================================

  email = '';

  mobile = '';

  countryCode = '+91';

  userName = '';

  companyName = '';

  companyId: number | null = null;

  role = 'PHARMACIST';


  // =====================================================
  // UI STATE
  // =====================================================

  loading = false;

  resending = false;

  errorMessage = '';

  successMessage = '';


  // =====================================================
  // OTP TIMER
  // =====================================================

  countdown = 60;

  timer: any;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

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

    // ---------------------------------------------------
    // OTP FORM
    // ---------------------------------------------------

    this.otpForm = this.fb.group({

      otp: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{6}$/)
        ]
      ]

    });


    // ---------------------------------------------------
    // GET DATA FROM ROUTER STATE
    // ---------------------------------------------------

    const state =
      history.state;


    this.email =
      state?.email ||
      sessionStorage.getItem('signupEmail') ||
      '';


    this.mobile =
      state?.mobile ||
      sessionStorage.getItem('signupMobile') ||
      '';


    this.countryCode =
      state?.countryCode ||
      sessionStorage.getItem('signupCountryCode') ||
      '+91';


    this.userName =
      state?.userName ||
      sessionStorage.getItem('signupUserName') ||
      '';


    this.companyName =
      state?.companyName ||
      sessionStorage.getItem('signupCompanyName') ||
      '';


    const storedCompanyId =
      state?.companyId ||
      sessionStorage.getItem('signupCompanyId');


    this.companyId =
      storedCompanyId
        ? Number(storedCompanyId)
        : null;


    this.role =
      state?.role ||
      sessionStorage.getItem('signupRole') ||
      'PHARMACIST';


    // ---------------------------------------------------
    // START TIMER
    // ---------------------------------------------------

    this.startTimer();


    // ---------------------------------------------------
    // DEBUG
    // ---------------------------------------------------

    console.log(
      'OTP PAGE DATA:',
      {
        email: this.email,
        mobile: this.mobile,
        countryCode: this.countryCode,
        userName: this.userName,
        companyName: this.companyName,
        companyId: this.companyId,
        role: this.role
      }
    );

  }


  // =====================================================
  // VERIFY OTP
  // =====================================================

  verifyOtp(): void {

    // ---------------------------------------------------
    // VALIDATE FORM
    // ---------------------------------------------------

    if (this.otpForm.invalid) {

      this.otpForm.markAllAsTouched();

      return;

    }


    this.loading = true;

    this.errorMessage = '';

    this.successMessage = '';


    const otp =
      this.otpForm.get('otp')?.value;


    // ===================================================
    // OTP REQUEST
    // ===================================================

    const request = {

      countryCode:
        this.countryCode,

      mobile:
        this.mobile,

      otp:
        otp

    };


    console.log(
      '======================================'
    );

    console.log(
      'VERIFY OTP REQUEST:',
      request
    );

    console.log(
      '======================================'
    );


    // ===================================================
    // CALL BACKEND
    // ===================================================

    this.authService
      .verifyOtp(request)
      .subscribe({

        // ===============================================
        // SUCCESS
        // ===============================================

        next: (response) => {
          console.log('OTP VERIFY SUCCESS/RESPONSE:', response);
          this.loading = false;

          if (response?.success === false) {
            this.errorMessage = response?.message || 'Invalid OTP. Please enter the correct code.';
            this.cdr.detectChanges();
            return;
          }

          this.successMessage =
            response?.message ||
            'OTP verified successfully!';
          this.cdr.detectChanges();

          // Clear temp registration data
          sessionStorage.removeItem('signupEmail');
          sessionStorage.removeItem('signupMobile');
          sessionStorage.removeItem('signupCountryCode');
          sessionStorage.removeItem('signupUserName');
          sessionStorage.removeItem('signupCompanyName');
          sessionStorage.removeItem('signupCompanyId');
          sessionStorage.removeItem('signupRole');

          // Navigate to login
          setTimeout(() => {
            this.router.navigate(
              ['/login'],
              {
                state: {
                  email: this.email
                }
              }
            );
          }, 1200);
        },

        error: (err) => {
          this.loading = false;
          console.error('OTP VERIFY ERROR:', err);
          console.error('OTP ERROR BODY:', err?.error);

          let msg = '';
          if (err?.error?.message) {
            msg = err.error.message;
          } else if (err?.error?.error) {
            msg = err.error.error;
          } else if (typeof err?.error === 'string' && err.error.trim().length > 0) {
            msg = err.error;
          } else if (err?.message) {
            msg = err.message;
          } else {
            msg = 'Invalid OTP. Please check the code and try again.';
          }

          this.errorMessage = msg;
          this.cdr.detectChanges();
        }
      });

  }


  // =====================================================
  // RESEND OTP
  // =====================================================

  resendOtp(): void {
    if (this.resending) {
      return;
    }

    if (this.countdown > 0) {
      return;
    }

    this.resending = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      countryCode: this.countryCode,
      mobile: this.mobile,
      email: this.email
    };

    console.log('RESEND OTP REQUEST:', payload);

    this.authService
      .resendOtp(payload)
      .subscribe({
        next: (response) => {
          console.log('RESEND OTP SUCCESS:', response);
          this.resending = false;

          const resendOtpVal = response?.otpResponse?.otp ?? response?.otp;
          this.successMessage = response?.message || 'New OTP sent successfully!';
          if (resendOtpVal) {
            this.successMessage += ` (Demo OTP: ${resendOtpVal})`;
          }

          this.countdown = 60;
          this.startTimer();
          this.cdr.detectChanges();
        },

        error: (err) => {
          this.resending = false;
          console.error('RESEND OTP ERROR:', err);
          this.errorMessage =
            err?.error?.message ||
            err?.message ||
            'Unable to resend OTP. Please try again.';
          this.cdr.detectChanges();
        }
      });
  }


  // =====================================================
  // OTP TIMER
  // =====================================================

  startTimer(): void {
    this.stopTimer();

    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
        this.cdr.detectChanges();
      } else {
        this.stopTimer();
        this.cdr.detectChanges();
      }
    }, 1000);
  }


  // =====================================================
  // STOP TIMER
  // =====================================================

  stopTimer(): void {

    if (this.timer) {

      clearInterval(this.timer);

      this.timer = null;

    }

  }


  // =====================================================
  // GO BACK
  // =====================================================

  backToSignup(): void {

    this.stopTimer();

    this.router.navigate(
      ['/signup']
    );

  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.stopTimer();

  }

}