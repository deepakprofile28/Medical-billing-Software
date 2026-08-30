import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

import {
  PatientService,
  Patient
} from '../../../../services/patient.service';

import { AuthService } from '../../../../services/auth.service';


// =====================================================
// INVOICE ITEM
// =====================================================

export interface InvoiceItem {

  id: string;

  patientName: string;

  patientId: number | string;

  service: string;

  department:
    | 'OPD'
    | 'IPD'
    | 'Pharmacy'
    | 'Diagnostics'
    | 'Surgery'
    | 'ICU';

  amount: number;

  paymentMethod:
    | 'Insurance / TPA'
    | 'Credit Card'
    | 'Cash / UPI'
    | 'Pending Claim';

  status:
    | 'Paid'
    | 'Pending'
    | 'In Review'
    | 'Partially Paid';

  date: string;
}


// =====================================================
// DEPARTMENT STAT
// =====================================================

export interface DepartmentStat {

  name: string;

  icon: string;

  activeCount: number;

  capacity: number;

  percentage: number;

  color: string;
}


// =====================================================
// DASHBOARD COMPONENT
// =====================================================

@Component({

  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css'

})


export class Dashboard implements OnInit, OnDestroy {


  // =====================================================
  // LOADING & STATE
  // =====================================================

  loading = true;

  errorMessage = '';

  currentDateTime = '';

  selectedPeriod:
    | 'today'
    | 'week'
    | 'month'
    | 'year' = 'month';

  private clockSubscription?: ReturnType<typeof setInterval>;


  // =====================================================
  // PATIENT DATA
  // =====================================================

  patients: Patient[] = [];

  drafts: Patient[] = [];

  recentPatients: Patient[] = [];


  // =====================================================
  // PATIENT METRICS
  // =====================================================

  totalPatientsCount = 0;

  todayPatientsCount = 0;

  insuredPatientsCount = 0;

  insuredPercentage = 0;

  activePatientsCount = 0;

  draftsCount = 0;


  // =====================================================
  // FINANCIAL / BILLING METRICS
  // =====================================================

  totalRevenue = 845200;

  pendingAmount = 118400;

  collectedThisMonth = 382500;

  claimApprovalRate = 96.4;


  // =====================================================
  // DEMOGRAPHICS
  // =====================================================

  genderDistribution = {
    male: 0,
    female: 0,
    other: 0
  };

  bloodGroupCounts: {
    [key: string]: number
  } = {};


  // =====================================================
  // DEPARTMENT OCCUPANCY
  // =====================================================

  departments: DepartmentStat[] = [

    {
      name: 'Outpatient (OPD)',
      icon: 'bi-person-walking',
      activeCount: 42,
      capacity: 60,
      percentage: 70,
      color: '#2563eb'
    },

    {
      name: 'Inpatient (IPD)',
      icon: 'bi-hospital',
      activeCount: 38,
      capacity: 50,
      percentage: 76,
      color: '#059669'
    },

    {
      name: 'ICU & Critical Care',
      icon: 'bi-heart-pulse-fill',
      activeCount: 8,
      capacity: 10,
      percentage: 80,
      color: '#dc2626'
    },

    {
      name: 'Diagnostic Lab',
      icon: 'bi-activity',
      activeCount: 65,
      capacity: 80,
      percentage: 81,
      color: '#7c3aed'
    },

    {
      name: 'Pharmacy Desk',
      icon: 'bi-capsule',
      activeCount: 112,
      capacity: 120,
      percentage: 93,
      color: '#ea580c'
    }

  ];


  // =====================================================
  // RECENT BILLING TRANSACTIONS
  // =====================================================

  recentInvoices: InvoiceItem[] = [

    {
      id: 'INV-2026-089',
      patientName: 'Kavitha Ramanathan',
      patientId: 101,
      service: 'General Consultation & Blood Panel',
      department: 'OPD',
      amount: 2450,
      paymentMethod: 'Cash / UPI',
      status: 'Paid',
      date: 'Today, 11:30 AM'
    },

    {
      id: 'INV-2026-088',
      patientName: 'Suresh Kumar',
      patientId: 102,
      service: 'Ortho Surgery & Inpatient Stay (3 Days)',
      department: 'IPD',
      amount: 68500,
      paymentMethod: 'Insurance / TPA',
      status: 'In Review',
      date: 'Today, 10:15 AM'
    },

    {
      id: 'INV-2026-087',
      patientName: 'Anitha Rajendran',
      patientId: 103,
      service: 'MRI Brain & Neurological Assessment',
      department: 'Diagnostics',
      amount: 9800,
      paymentMethod: 'Credit Card',
      status: 'Paid',
      date: 'Yesterday'
    },

    {
      id: 'INV-2026-086',
      patientName: 'Mohammed Faisal',
      patientId: 104,
      service: 'Cardio Monitoring & Medication',
      department: 'ICU',
      amount: 24000,
      paymentMethod: 'Pending Claim',
      status: 'Pending',
      date: 'Yesterday'
    },

    {
      id: 'INV-2026-085',
      patientName: 'Priya Sundaram',
      patientId: 105,
      service: 'Pediatric Vaccine & Prescription',
      department: 'Pharmacy',
      amount: 1750,
      paymentMethod: 'Cash / UPI',
      status: 'Paid',
      date: '27 Aug 2026'
    }

  ];


  // =====================================================
  // MONTHLY REVENUE TREND
  // =====================================================

  monthlyTrends = [

    {
      month: 'Mar',
      revenue: 520000,
      patientCount: 94,
      heightPercent: 62
    },

    {
      month: 'Apr',
      revenue: 610000,
      patientCount: 110,
      heightPercent: 72
    },

    {
      month: 'May',
      revenue: 580000,
      patientCount: 102,
      heightPercent: 68
    },

    {
      month: 'Jun',
      revenue: 740000,
      patientCount: 135,
      heightPercent: 86
    },

    {
      month: 'Jul',
      revenue: 790000,
      patientCount: 142,
      heightPercent: 92
    },

    {
      month: 'Aug',
      revenue: 845200,
      patientCount: 156,
      heightPercent: 100
    }

  ];


  // =====================================================
  // LOGGED-IN USER
  // =====================================================

  loggedInUser = 'Administrator';

  userRole = 'Billing Admin';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private patientService: PatientService,

    private authService: AuthService,

    private router: Router

  ) {}


  // =====================================================
  // ON INIT
  // =====================================================

  ngOnInit(): void {

    // Logged-in user
    this.loggedInUser =
      this.authService.getUserName() ||
      'Administrator';


    // Logged-in role
    this.userRole =
      this.authService.getRole() ||
      'Billing Admin';


    // Start clock
    this.updateClock();


    this.clockSubscription =
      setInterval(() => {

        this.updateClock();

      }, 1000);


    // Load dashboard
    this.loadDashboardData();

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }


  // =====================================================
  // ON DESTROY
  // =====================================================

  ngOnDestroy(): void {

    if (this.clockSubscription) {

      clearInterval(this.clockSubscription);

    }

  }


  // =====================================================
  // CURRENT DATE / TIME
  // =====================================================

  private updateClock(): void {

    const now = new Date();

    const options: Intl.DateTimeFormatOptions = {

      weekday: 'short',

      year: 'numeric',

      month: 'short',

      day: 'numeric',

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',

      hour12: true

    };


    this.currentDateTime =
      now.toLocaleString(
        'en-IN',
        options
      );

  }


  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  loadDashboardData(): void {

    this.loading = true;

    this.errorMessage = '';


    // ===================================================
    // LOAD PATIENTS
    // ===================================================

    this.patientService
      .getAllPatients()

      .pipe(

        catchError((err) => {

          console.error(
            'Failed to load patients:',
            err
          );


          /*
           * IMPORTANT
           *
           * Do NOT use demo patients here.
           *
           * PatientService already handles
           * local storage fallback.
           *
           * Returning [] prevents another
           * company's demo data from appearing.
           */

          this.errorMessage =
            'Unable to retrieve patient data.';


          return of([] as Patient[]);

        })

      )

      .subscribe({

        next: (data: Patient[]) => {

          this.patients =
            Array.isArray(data)
              ? data
              : [];


          // Calculate all metrics
          this.calculatePatientMetrics();


          this.loading = false;

        },


        error: (err) => {

          console.error(
            'Dashboard patient loading error:',
            err
          );


          this.patients = [];

          this.calculatePatientMetrics();


          this.errorMessage =
            'Could not retrieve patient data.';


          this.loading = false;

        }

      });


    // ===================================================
    // LOAD DRAFTS
    // ===================================================

    this.patientService
      .getDraftPatients()

      .pipe(

        catchError((err) => {

          console.error(
            'Failed to load drafts:',
            err
          );

          return of([] as Patient[]);

        })

      )

      .subscribe({

        next: (draftData: Patient[]) => {

          this.drafts =
            Array.isArray(draftData)
              ? draftData
              : [];


          this.draftsCount =
            this.drafts.length;

        },

        error: () => {

          this.drafts = [];

          this.draftsCount = 0;

        }

      });

  }


  // =====================================================
  // CALCULATE PATIENT METRICS
  // =====================================================

  private calculatePatientMetrics(): void {


    // ===================================================
    // TOTAL PATIENTS
    // ===================================================

    this.totalPatientsCount =
      this.patients.length;


    // ===================================================
    // TODAY
    // ===================================================

    const todayStr =
      new Date()
        .toISOString()
        .split('T')[0];


    let todayCount = 0;

    let insuredCount = 0;

    let activeCount = 0;


    let male = 0;

    let female = 0;

    let other = 0;


    const bgMap: {
      [key: string]: number
    } = {};


    // ===================================================
    // LOOP PATIENTS
    // ===================================================

    this.patients.forEach((p: Patient) => {


      // =================================================
      // CREATED TODAY
      // =================================================

      if (

        p.createdDate &&

        p.createdDate.startsWith(todayStr)

      ) {

        todayCount++;

      }


      // =================================================
      // INSURANCE
      // =================================================

      if (

        p.insuranceProvider &&

        p.insuranceProvider
          .trim()
          .length > 0

      ) {

        insuredCount++;

      }


      // =================================================
      // ACTIVE PATIENTS
      // =================================================

      if (

        !p.status ||

        p.status
          .toLowerCase()
          .trim() === 'active'

      ) {

        activeCount++;

      }


      // =================================================
      // GENDER
      // =================================================

      const gender =
        (p.gender || '')
          .toLowerCase()
          .trim();


      if (

        gender === 'male' ||

        gender === 'm'

      ) {

        male++;

      }

      else if (

        gender === 'female' ||

        gender === 'f'

      ) {

        female++;

      }

      else {

        other++;

      }


      // =================================================
      // BLOOD GROUP
      // =================================================

      if (p.bloodGroup) {

        const bg =
          p.bloodGroup
            .toUpperCase()
            .trim();


        bgMap[bg] =
          (bgMap[bg] || 0) + 1;

      }

    });


    // ===================================================
    // SET METRICS
    // ===================================================

    this.todayPatientsCount =
      todayCount;


    this.insuredPatientsCount =
      insuredCount;


    this.insuredPercentage =
      this.totalPatientsCount > 0

        ? Math.round(
            (
              insuredCount /
              this.totalPatientsCount
            ) * 100
          )

        : 0;


    this.activePatientsCount =
      activeCount;


    this.genderDistribution = {

      male,

      female,

      other

    };


    this.bloodGroupCounts =
      bgMap;


    // ===================================================
    // RECENT PATIENTS
    // ===================================================

    this.recentPatients =
      [...this.patients]

        .sort((a, b) => {

          const dateA =
            a.createdDate
              ? new Date(a.createdDate).getTime()
              : 0;


          const dateB =
            b.createdDate
              ? new Date(b.createdDate).getTime()
              : 0;


          return dateB - dateA;

        })

        .slice(0, 5);

  }


  // =====================================================
  // NAVIGATION
  // =====================================================

  navigateTo(path: string): void {

    this.router.navigate([path]);

  }


  // =====================================================
  // VIEW PATIENT
  // =====================================================

  viewPatient(patient: Patient): void {

    this.router.navigate(
      ['/patient-details'],
      {
        state: {
          patient
        }
      }
    );

  }


  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  refreshDashboard(): void {

    this.loadDashboardData();

  }


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  formatCurrency(val: number): string {

    return new Intl.NumberFormat(
      'en-IN',
      {

        style: 'currency',

        currency: 'INR',

        maximumFractionDigits: 0

      }

    ).format(val);

  }

}