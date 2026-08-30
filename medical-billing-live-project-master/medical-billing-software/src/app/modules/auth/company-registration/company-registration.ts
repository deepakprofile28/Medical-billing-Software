import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  AuthService,
  CompanyRegistrationRequest
} from '../../services/auth.service';


// =====================================================
// COUNTRY CODE MODEL
// =====================================================

export interface CountryCodeItem {

  code: string;

  country: string;

  flag: string;

  iso: string;

  mobileLength: number;

}


// =====================================================
// COMPONENT
// =====================================================

@Component({

  selector: 'app-company-registration',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],

  templateUrl: './company-registration.html',

  styleUrl: './company-registration.css'

})
export class CompanyRegistration
  implements OnInit, OnDestroy {


  // ===================================================
  // FORM
  // ===================================================

  accountForm!: FormGroup;


  // ===================================================
  // PASSWORD
  // ===================================================

  hideNewPassword = true;

  hideConfirmPassword = true;


  // ===================================================
  // PAGE STATE
  // ===================================================

  loading = false;

  successMessage = '';

  errorMessage = '';


  // ===================================================
  // OTP STATE
  // ===================================================

  showOtpModal = false;

  otpCode = '';

  otpError = '';

  otpSending = false;

  otpTimer = 0;

  generatedOtp = '';

  otpNotification = '';

  otpTimerInterval?: any;


  // ===================================================
  // COMPANY ID
  // ===================================================

  private registeredCompanyId: number | null = null;


  // ===================================================
  // COUNTRY CODES
  // ===================================================

  readonly countryCodes: CountryCodeItem[] = [

    {
      code: '+91',
      country: 'India',
      flag: '🇮🇳',
      iso: 'in',
      mobileLength: 10
    },

    {
      code: '+971',
      country: 'UAE',
      flag: '🇦🇪',
      iso: 'ae',
      mobileLength: 9
    },

    {
      code: '+966',
      country: 'Saudi Arabia',
      flag: '🇸🇦',
      iso: 'sa',
      mobileLength: 9
    },

    {
      code: '+65',
      country: 'Singapore',
      flag: '🇸🇬',
      iso: 'sg',
      mobileLength: 8
    },

    {
      code: '+60',
      country: 'Malaysia',
      flag: '🇲🇾',
      iso: 'my',
      mobileLength: 9
    },

    {
      code: '+94',
      country: 'Sri Lanka',
      flag: '🇱🇰',
      iso: 'lk',
      mobileLength: 9
    },

    {
      code: '+974',
      country: 'Qatar',
      flag: '🇶🇦',
      iso: 'qa',
      mobileLength: 8
    },

    {
      code: '+968',
      country: 'Oman',
      flag: '🇴🇲',
      iso: 'om',
      mobileLength: 8
    },

    {
      code: '+965',
      country: 'Kuwait',
      flag: '🇰🇼',
      iso: 'kw',
      mobileLength: 8
    },

    {
      code: '+973',
      country: 'Bahrain',
      flag: '🇧🇭',
      iso: 'bh',
      mobileLength: 8
    },

    {
      code: '+1',
      country: 'USA',
      flag: '🇺🇸',
      iso: 'us',
      mobileLength: 10
    },

    {
      code: '+44',
      country: 'UK',
      flag: '🇬🇧',
      iso: 'gb',
      mobileLength: 10
    },

    {
      code: '+61',
      country: 'Australia',
      flag: '🇦🇺',
      iso: 'au',
      mobileLength: 9
    }

  ];


  // ===================================================
  // SELECTED COUNTRY
  // ===================================================

  selectedCountry: CountryCodeItem =
    this.countryCodes[0];


  // ===================================================
  // DROPDOWN
  // ===================================================

  isFlagDropdownOpen = false;


  @ViewChild('flagContainer')
  flagContainer?: ElementRef;


  // ===================================================
  // CONSTRUCTOR
  // ===================================================

  constructor(

    private fb: FormBuilder,

    private router: Router,

    private authService: AuthService

  ) {}


  // ===================================================
  // INIT
  // ===================================================

  ngOnInit(): void {

    this.accountForm =
      this.fb.group(

        {

          name: [
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


          countryCode: [
            '+91',
            Validators.required
          ],


          mobile: [
            '',
            [
              Validators.required,
              Validators.pattern(/^[0-9]+$/)
            ]
          ],


          address: [
            '',
            [
              Validators.required,
              Validators.minLength(5)
            ]
          ],


          newPassword: [
            '',
            [
              Validators.required,
              Validators.minLength(6)
            ]
          ],


          confirmPassword: [
            '',
            Validators.required
          ],


          agreeTerms: [
            true,
            Validators.requiredTrue
          ]

        },

        {
          validators:
            this.passwordMatchValidator.bind(this)
        }

      );


    // ===============================================
    // COUNTRY-BASED MOBILE VALIDATION
    // ===============================================

    this.accountForm
      .get('mobile')
      ?.valueChanges
      .subscribe(() => {

        this.validateMobileLength();

      });

  }


  // ===================================================
  // DESTROY
  // ===================================================

  ngOnDestroy(): void {

    if (this.otpTimerInterval) {

      clearInterval(
        this.otpTimerInterval
      );

    }

  }


  // ===================================================
  // COUNTRY DROPDOWN
  // ===================================================

  toggleFlagDropdown(
    event?: Event
  ): void {

    event?.stopPropagation();

    this.isFlagDropdownOpen =
      !this.isFlagDropdownOpen;

  }


  // ===================================================
  // SELECT COUNTRY
  // ===================================================

  selectCountry(
    country: CountryCodeItem,
    event?: Event
  ): void {

    event?.stopPropagation();

    this.selectedCountry = country;

    this.accountForm.patchValue({

      countryCode:
        country.code

    });


    // Revalidate mobile

    this.validateMobileLength();


    this.isFlagDropdownOpen =
      false;

  }


  // ===================================================
  // CLOSE COUNTRY DROPDOWN
  // ===================================================

  closeFlagDropdown(
    event?: Event
  ): void {

    event?.stopPropagation();

    this.isFlagDropdownOpen =
      false;

  }


  // ===================================================
  // DOCUMENT CLICK
  // ===================================================

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    if (
      this.isFlagDropdownOpen &&
      this.flagContainer
    ) {

      const target =
        event.target as HTMLElement;

      if (
        !this.flagContainer
          .nativeElement
          .contains(target)
      ) {

        this.isFlagDropdownOpen =
          false;

      }

    }

  }


  // ===================================================
  // COUNTRY BASED MOBILE VALIDATION
  // ===================================================

  private validateMobileLength(): void {

    const mobileControl =
      this.accountForm.get('mobile');

    if (!mobileControl) {
      return;
    }


    const mobile =
      mobileControl.value;


    // Remove old custom error

    const errors =
      {
        ...(mobileControl.errors || {})
      };

    delete errors['countryMobileLength'];


    if (!mobile) {

      mobileControl.setErrors(
        Object.keys(errors).length
          ? errors
          : null
      );

      return;

    }


    // Only numbers

    if (!/^[0-9]+$/.test(mobile)) {

      return;

    }


    const requiredLength =
      this.selectedCountry.mobileLength;


    if (
      mobile.length !==
      requiredLength
    ) {

      errors['countryMobileLength'] = {

        requiredLength:
          requiredLength,

        actualLength:
          mobile.length,

        country:
          this.selectedCountry.country

      };

      mobileControl.setErrors(
        errors
      );

      return;

    }


    mobileControl.setErrors(
      Object.keys(errors).length
        ? errors
        : null
    );

  }


  // ===================================================
  // PASSWORD VALIDATOR
  // ===================================================

  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const password =
      control.get('newPassword')
        ?.value;

    const confirmPassword =
      control.get('confirmPassword')
        ?.value;


    if (
      password &&
      confirmPassword &&
      password !== confirmPassword
    ) {

      control
        .get('confirmPassword')
        ?.setErrors({
          ...(control
            .get('confirmPassword')
            ?.errors || {}),
          passwordMismatch: true
        });

      return {
        passwordMismatch: true
      };

    }


    return null;

  }


  // ===================================================
  // PASSWORD TOGGLE
  // ===================================================

  toggleNewPassword(): void {

    this.hideNewPassword =
      !this.hideNewPassword;

  }


  toggleConfirmPassword(): void {

    this.hideConfirmPassword =
      !this.hideConfirmPassword;

  }


  // ===================================================
  // REGISTER CLICK
  // ===================================================

  onRegisterClick(): void {

    this.successMessage = '';

    this.errorMessage = '';


    // Make sure country validation runs

    this.validateMobileLength();


    if (
      this.accountForm.invalid
    ) {

      this.accountForm
        .markAllAsTouched();


      this.errorMessage =
        'Please complete all required fields correctly before proceeding.';

      return;

    }


    this.sendOtp();

  }


  // ===================================================
  // SEND OTP
  // ===================================================

  sendOtp(): void {

    this.validateMobileLength();


    if (
      this.accountForm.get('mobile')
        ?.invalid
    ) {

      this.accountForm
        .get('mobile')
        ?.markAsTouched();

      this.errorMessage =
        `Please enter a valid ${this.selectedCountry.country} mobile number.`;

      return;

    }


    this.otpSending = true;

    this.otpError = '';

    this.errorMessage = '';


    const value =
      this.accountForm.value;


    const request:
      CompanyRegistrationRequest = {

        companyName:
          value.name,

        businessType:
          'PHARMACY',

        drugLicenseNumber:
          'DL-' +
          Math.floor(
            100000 +
            Math.random() * 900000
          ),

        businessPhone:
          value.mobile,

        businessEmail:
          value.email,

        countryCode:
          value.countryCode,

        mobile:
          value.mobile,

        address:
          value.address,

        city:
          'Chennai',

        state:
          'Tamil Nadu',

        pincode:
          '600001',

        invoicePrefix:
          'MED-',

        ownerName:
          value.name,

        ownerEmail:
          value.email,

        ownerMobile:
          value.mobile,

        ownerCountryCode:
          value.countryCode,

        password:
          value.newPassword,

        status:
          'ACTIVE'

      };


    console.log(
      'REGISTRATION REQUEST:',
      request
    );


    // =================================================
    // BACKEND CALL
    // =================================================

    this.authService
      .registerCompany(request)
      .subscribe({

        next: (response) => {
          console.log('REGISTER RESPONSE:', response);
          this.otpSending = false;

          this.registeredCompanyId =
            response?.company?.id ??
            response?.id ??
            null;

          const backendOtp =
            response?.otpResponse?.otp ??
            response?.otpResponse ??
            response?.otp;

          if (backendOtp && typeof backendOtp === 'string') {
            this.generatedOtp = backendOtp;
            this.otpCode = backendOtp;
          }

          // Save temp registration data for OTP verification page
          sessionStorage.setItem('signupEmail', value.email);
          sessionStorage.setItem('signupMobile', value.mobile);
          sessionStorage.setItem('signupCountryCode', value.countryCode || '+91');
          sessionStorage.setItem('signupUserName', value.name);
          sessionStorage.setItem('signupCompanyName', value.name);
          sessionStorage.setItem('signupRole', 'PHARMACIST');
          if (this.registeredCompanyId) {
            sessionStorage.setItem('signupCompanyId', this.registeredCompanyId.toString());
          }

          // Navigate directly to the dedicated OTP Verification Page
          this.router.navigate(['/verify-otp'], {
            state: {
              email: value.email,
              mobile: value.mobile,
              countryCode: value.countryCode || '+91',
              userName: value.name,
              companyName: value.name,
              companyId: this.registeredCompanyId,
              role: 'PHARMACIST'
            }
          });
        },


        error: (error) => {

          console.error(
            'SEND OTP ERROR:',
            error
          );


          this.otpSending = false;


          if (
            error?.error?.message
          ) {

            this.errorMessage =
              error.error.message;

          } else {

            this.errorMessage =
              'Unable to send OTP. Please check the backend and try again.';

          }

        }

      });

  }


  // ===================================================
  // OTP TIMER
  // ===================================================

  private startOtpTimer(): void {

    this.otpTimer = 30;


    if (this.otpTimerInterval) {

      clearInterval(
        this.otpTimerInterval
      );

    }


    this.otpTimerInterval =
      setInterval(() => {

        if (this.otpTimer > 0) {

          this.otpTimer--;

        } else {

          clearInterval(
            this.otpTimerInterval
          );

        }

      }, 1000);

  }


  // ===================================================
  // RESEND OTP
  // ===================================================

  resendOtp(): void {

    if (
      this.otpTimer > 0 ||
      this.otpSending
    ) {

      return;

    }


    this.sendOtp();

  }


  // ===================================================
  // CLOSE OTP MODAL
  // ===================================================

  closeOtpModal(): void {

    this.showOtpModal = false;

    this.otpError = '';

    this.otpNotification = '';

  }


  // ===================================================
  // VERIFY OTP
  // ===================================================

  verifyOtpAndSubmit(): void {

    const otp =
      this.otpCode?.trim();


    if (
      !otp ||
      otp.length !== 6
    ) {

      this.otpError =
        'Please enter the 6-digit OTP code.';

      return;

    }


    if (!/^[0-9]{6}$/.test(otp)) {

      this.otpError =
        'OTP must contain only 6 digits.';

      return;

    }


    this.loading = true;

    this.otpError = '';


    const value =
      this.accountForm.value;


    // =================================================
    // VERIFY OTP REQUEST
    // =================================================

    const verifyRequest = {

      countryCode:
        value.countryCode,

      mobile:
        value.mobile,

      otp:
        otp

    };


    console.log(
      'VERIFY OTP REQUEST:',
      verifyRequest
    );


    // =================================================
    // BACKEND VERIFY OTP
    // =================================================

    this.authService
      .verifyOtp(verifyRequest)
      .subscribe({

        next: (response) => {

          console.log(
            'OTP VERIFIED:',
            response
          );


          this.loading = false;

          this.showOtpModal =
            false;


          this.successMessage =
            `Congratulations ${value.name}! Your pharmacy account has been registered successfully.`;


          // ---------------------------------------------
          // Save company info
          // ---------------------------------------------

          if (
            this.registeredCompanyId
          ) {

            localStorage.setItem(
              'companyId',
              this.registeredCompanyId
                .toString()
            );

          }


          localStorage.setItem(
            'companyName',
            value.name
          );


          localStorage.setItem(
            'userName',
            value.name
          );


          localStorage.setItem(
            'role',
            'ADMIN'
          );


          // ---------------------------------------------
          // IMPORTANT
          //
          // Backend verifyOtp currently returns only
          // success message, not JWT.
          //
          // So DON'T create fake JWT token here.
          // ---------------------------------------------

          setTimeout(() => {

            this.router.navigate([
              '/login'
            ]);

          }, 1500);

        },


        error: (error) => {

          console.error(
            'VERIFY OTP ERROR:',
            error
          );


          this.loading = false;


          if (
            error?.error?.message
          ) {

            this.otpError =
              error.error.message;

          } else {

            this.otpError =
              'Invalid or expired OTP. Please try again.';

          }

        }

      });

  }

}