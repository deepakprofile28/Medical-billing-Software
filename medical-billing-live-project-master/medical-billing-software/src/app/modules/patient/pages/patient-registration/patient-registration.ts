import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { PatientForm } from '../../components/patient-form/patient-form';

import { PatientService } from '../../services/patient.service';

import {
  ActivatedRoute,
  Router
} from '@angular/router';


@Component({
  selector: 'app-patient-registration',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    PatientForm
  ],

  templateUrl: './patient-registration.html',

  styleUrl: './patient-registration.css'
})
export class PatientRegistration
  implements OnInit, AfterViewInit {


  // =====================================================
  // STEP
  // =====================================================

  currentStep = 1;

  patientAge = 0;

  patientForm: FormGroup;


  // =====================================================
  // EDIT MODE
  // =====================================================

  isEditMode = false;

  editPatientId: number | null = null;


  // =====================================================
  // TOAST
  // =====================================================

  showToastMessage = '';

  showToastType: 'success' | 'error' = 'success';

  showToastVisible = false;


  // =====================================================
  // PREVIEW CAROUSEL
  // =====================================================

  previewIndex = 0;

  totalPreviews = 5;

  @ViewChild('previewPanel', { static: false })
  previewPanel!: ElementRef<HTMLElement>;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private fb: FormBuilder,

    private patientService: PatientService,

    private router: Router,

    private route: ActivatedRoute
  ) {

    // ===================================================
    // CREATE FORM
    // ===================================================

    this.patientForm = this.fb.group({

      // ---------------- PERSONAL ----------------

      name: [''],

      mobile: [''],

      email: [''],

      dob: [''],

      gender: [''],

      bloodGroup: [''],

      maritalStatus: [''],

      occupation: [''],

      aadhaar: [''],

      pan: [''],

      emergencyContact: [''],

      emergencyName: [''],


      // ---------------- ADDRESS ----------------

      address1: [''],

      address2: [''],

      district: [''],

      city: [''],

      state: [''],

      country: ['India'],

      pincode: [''],


      // ---------------- MEDICAL ----------------

      medicalHistory: [''],

      currentMedication: [''],

      allergies: [''],


      // ---------------- INSURANCE ----------------

      insuranceProvider: [''],

      policyNumber: [''],

      policyHolderName: ['']

    });

  }


  // =====================================================
  // ON INIT
  // =====================================================

  ngOnInit(): void {

    console.log(
      'Patient Registration component initialized'
    );

    this.loadPatientForEdit();

  }


  // =====================================================
  // LOAD PATIENT FOR EDIT
  // =====================================================

  private loadPatientForEdit(): void {

    this.route.queryParams.subscribe(params => {

      console.log(
        'Query Params:',
        params
      );


      const id = params['id'];


      // =================================================
      // NEW PATIENT
      // =================================================

      if (!id) {

        console.log(
          'New Patient Registration'
        );

        this.isEditMode = false;

        this.editPatientId = null;

        return;

      }


      // =================================================
      // EDIT MODE
      // =================================================

      this.isEditMode = true;

      this.editPatientId = Number(id);


      console.log(
        'EDIT MODE'
      );

      console.log(
        'Edit Patient ID:',
        this.editPatientId
      );


      // =================================================
      // GET PATIENT BY ID
      // =================================================

      this.patientService
        .getPatientById(this.editPatientId)
        .subscribe({

          // =============================================
          // SUCCESS
          // =============================================

          next: (response: any) => {

            console.log(
              'API Patient Response:',
              response
            );


            // =========================================
            // HANDLE RESPONSE
            // =========================================

            const patient =
              response?.data
                ? response.data
                : response;


            console.log(
              'Patient object used for patch:',
              patient
            );


            if (!patient) {

              console.error(
                'Patient data is empty'
              );

              this.showToast(
                'Patient details not found',
                'error'
              );

              return;

            }


            // =========================================
            // FORMAT DOB
            // =========================================

            let dobValue =
              patient.dob || '';


            if (dobValue) {

              try {

                const date =
                  new Date(dobValue);


                if (!isNaN(date.getTime())) {

                  dobValue =
                    date
                      .toISOString()
                      .split('T')[0];

                }

              } catch (error) {

                console.warn(
                  'DOB conversion failed:',
                  error
                );

              }

            }


            // =========================================
            // PATCH ALL FORM FIELDS
            // =========================================

            this.patientForm.patchValue({

              // ---------------- PERSONAL ----------------

              name:
                patient.name ?? '',

              mobile:
                patient.mobile ?? '',

              email:
                patient.email ?? '',

              dob:
                dobValue,

              gender:
                patient.gender ?? '',

              bloodGroup:
                patient.bloodGroup ?? '',

              maritalStatus:
                patient.maritalStatus ?? '',

              occupation:
                patient.occupation ?? '',

              aadhaar:
                patient.aadhaar ?? '',

              pan:
                patient.pan ?? '',

              emergencyContact:
                patient.emergencyContact ?? '',

              emergencyName:
                patient.emergencyName ?? '',


              // ---------------- ADDRESS ----------------

              address1:
                patient.address1 ?? '',

              address2:
                patient.address2 ?? '',

              district:
                patient.district ?? '',

              city:
                patient.city ?? '',

              state:
                patient.state ?? '',

              country:
                patient.country ?? 'India',

              pincode:
                patient.pincode ?? '',


              // ---------------- MEDICAL ----------------

              medicalHistory:
                patient.medicalHistory ?? '',

              currentMedication:
                patient.currentMedication ?? '',

              allergies:
                patient.allergies ?? '',


              // ---------------- INSURANCE ----------------

              insuranceProvider:
                patient.insuranceProvider ?? '',

              policyNumber:
                patient.policyNumber ?? '',

              policyHolderName:
                patient.policyHolderName ?? ''

            });


            // =========================================
            // CALCULATE AGE
            // =========================================

            this.calculatePatientAge();


            // =========================================
            // DEBUG
            // =========================================

            console.log(
              'FORM DATA AFTER PATCH:',
              this.patientForm.getRawValue()
            );

            console.log(
              'EDIT MODE:',
              this.isEditMode
            );

            console.log(
              'EDIT PATIENT ID:',
              this.editPatientId
            );

          },


          // =============================================
          // ERROR
          // =============================================

          error: (error) => {

            console.error(
              'Failed to load patient:',
              error
            );


            this.showToast(
              'Failed to load patient details',
              'error'
            );

          }

        });

    });

  }


  // =====================================================
  // CALCULATE AGE
  // =====================================================

  calculatePatientAge(): void {

    const dob =
      this.patientForm
        .get('dob')
        ?.value;


    if (!dob) {

      this.patientAge = 0;

      return;

    }


    const birthDate =
      new Date(dob);

    const today =
      new Date();


    let age =
      today.getFullYear() -
      birthDate.getFullYear();


    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();


    if (

      monthDifference < 0 ||

      (
        monthDifference === 0 &&
        today.getDate() < birthDate.getDate()
      )

    ) {

      age--;

    }


    this.patientAge = age;

  }


  // =====================================================
  // AFTER VIEW INIT
  // =====================================================

  ngAfterViewInit(): void {

    setTimeout(() => {

      this.scrollToPreview(
        this.previewIndex
      );

    }, 100);

  }


  // =====================================================
  // TOAST
  // =====================================================

  showToast(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.showToastMessage =
      message;

    this.showToastType =
      type;

    this.showToastVisible =
      true;

  }


  closeToast(): void {

    this.showToastVisible =
      false;

  }


  // =====================================================
  // PREVIEW
  // =====================================================

  goToPreview(index: number): void {

    if (index < 0) {

      index = 0;

    }


    if (index >= this.totalPreviews) {

      index =
        this.totalPreviews - 1;

    }


    this.previewIndex =
      index;


    this.scrollToPreview(
      index
    );

  }


  nextPreview(): void {

    const next =
      Math.min(
        this.previewIndex + 1,
        this.totalPreviews - 1
      );


    this.goToPreview(
      next
    );

  }


  prevPreview(): void {

    const previous =
      Math.max(
        this.previewIndex - 1,
        0
      );


    this.goToPreview(
      previous
    );

  }


  private scrollToPreview(
    index: number
  ): void {

    try {

      const panel =
        this.previewPanel
          ?.nativeElement;


      if (!panel) {

        return;

      }


      const slideWidth =
        panel.clientWidth;


      panel.scrollTo({

        left:
          index * slideWidth,

        behavior:
          'smooth'

      });

    }

    catch (error) {

      console.warn(
        'Preview scroll failed:',
        error
      );

    }

  }


  // =====================================================
  // NEXT STEP
  // =====================================================

  nextStep(): void {

    if (this.currentStep < 5) {

      this.currentStep++;

      this.goToPreview(
        this.currentStep - 1
      );

    }
    else {

      this.savePatient();

    }

  }


  // =====================================================
  // PREVIOUS STEP
  // =====================================================

  previousStep(): void {

    if (this.currentStep > 1) {

      this.currentStep--;

      this.goToPreview(
        this.currentStep - 1
      );

    }

  }


  // =====================================================
  // SAVE / UPDATE PATIENT
  // =====================================================

  savePatient(): void {

    const patientData =
      this.patientForm.getRawValue();


    console.log(
      'Patient Data:',
      patientData
    );


    // =================================================
    // UPDATE EXISTING PATIENT
    // =================================================

    if (

      this.isEditMode &&

      this.editPatientId !== null

    ) {

      console.log(
        'Updating Patient ID:',
        this.editPatientId
      );


      this.patientService
        .updatePatient(
          this.editPatientId,
          patientData
        )
        .subscribe({

          // =========================================
          // UPDATE SUCCESS
          // =========================================

          next: (response) => {

            console.log(
              'Patient updated successfully:',
              response
            );


            this.showToast(
              'Patient updated successfully',
              'success'
            );


            setTimeout(() => {

              this.router.navigate([
                '/patients'
              ]);

            }, 1000);

          },


          // =========================================
          // UPDATE ERROR
          // =========================================

          error: (error) => {

            console.error(
              'Patient update failed:',
              error
            );


            this.showToast(
              'Failed to update patient',
              'error'
            );

          }

        });


      return;

    }


    // =================================================
    // CREATE NEW PATIENT
    // =================================================

    console.log(
      'Creating new patient'
    );


    this.patientService
      .savePatient(patientData)
      .subscribe({

        // =============================================
        // CREATE SUCCESS
        // =============================================

        next: (response) => {

          console.log(
            'Patient saved successfully:',
            response
          );


          this.showToast(
            'Patient saved successfully',
            'success'
          );


          // Reset form

          this.patientForm.reset({

            country:
              'India'

          });


          this.currentStep = 1;

          this.previewIndex = 0;


          setTimeout(() => {

            this.router.navigate([
              '/patients'
            ]);

          }, 1000);

        },


        // =============================================
        // CREATE ERROR
        // =============================================

        error: (error) => {

          console.error(
            'Patient save failed:',
            error
          );


          this.showToast(
            'Failed to save patient',
            'error'
          );

        }

      });

  }

  saveDraft(): void {

  console.log('Saving patient as draft...');

  const patientData = {
    ...this.patientForm.getRawValue(),
    status: 'COMPLETED'
  };

  console.log('Draft Patient Data:', patientData);

  this.patientService.savePatient(patientData).subscribe({

    next: (response) => {

      console.log(
        'Draft saved successfully:',
        response
      );

      alert('Patient draft saved successfully');

      this.router.navigate([
        '/patients'
      ]);
    },

    error: (error) => {

      console.error(
        'Failed to save patient draft:',
        error
      );

      alert(
        'Failed to save patient draft'
      );
    }
  });
}

}