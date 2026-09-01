import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword implements OnInit, OnDestroy {

  // Current Step: 1 = Request Code, 2 = Verify Code & Set Password
  currentStep: 1 | 2 = 1;

  emailForm!: FormGroup;
  resetForm!: FormGroup;

  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;
  errorMessage = '';
  successMessage = '';

  userEmail = '';
  resendCountdown = 0;
  countdownTimer: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForms();

    // Check for query parameters (e.g. from direct Email Reset link: /reset-password?email=...&token=...)
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const token = params['token'] || params['otp'];

      if (email) {
        this.userEmail = email.trim().toLowerCase();
        this.emailForm.patchValue({ email: this.userEmail });
        this.resetForm.patchValue({ email: this.userEmail });
      }

      if (token) {
        this.resetForm.patchValue({ token: token.trim() });
        this.currentStep = 2;
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private initForms(): void {
    // Step 1 Form
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Step 2 Form
    this.resetForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        token: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]{6}$/)]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: this.passwordMatchValidator
      }
    );
  }

  // Password Match Validator
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // =====================================================
  // STEP 1: SEND RESET CODE
  // =====================================================
  onRequestCode(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const email = this.emailForm.value.email.trim().toLowerCase();
    this.userEmail = email;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = `A 6-digit verification code has been sent to ${email}`;
        this.resetForm.patchValue({ email: email });
        this.currentStep = 2;
        this.startResendTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Forgot password request failed:', err);
        this.errorMessage =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Failed to send reset code. Please check your email and try again.';
        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // STEP 2: VERIFY TOKEN & RESET PASSWORD
  // =====================================================
  onResetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const val = this.resetForm.value;
    const payload = {
      email: this.userEmail || val.email,
      token: val.token.trim(),
      newPassword: val.newPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'Password reset successfully! Redirecting to login...';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { resetSuccess: 'true' }
          });
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        console.error('Password reset failed:', err);
        this.errorMessage =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Invalid or expired verification code. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // RESEND CODE
  // =====================================================
  onResendCode(): void {
    if (this.resendCountdown > 0 || !this.userEmail) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.authService.forgotPassword(this.userEmail).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'A new 6-digit code has been sent to your email.';
        this.startResendTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to resend code. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  goToStep1(): void {
    this.currentStep = 1;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  private startResendTimer(): void {
    this.clearTimer();
    this.resendCountdown = 60;
    this.countdownTimer = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
        this.cdr.detectChanges();
      } else {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  toggleNewPassword(): void {
    this.hideNewPassword = !this.hideNewPassword;
  }

  toggleConfirmPassword(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}

