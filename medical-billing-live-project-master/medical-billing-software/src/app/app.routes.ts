import { Routes } from '@angular/router';
import { PatientLogin } from './patient-login/patient-login';
import { Login } from './modules/auth/login/login';
import { Signup } from './modules/auth/signup/signup';
import { ForgotPassword } from './modules/auth/forgot-password/forgot-password';
import { VerifyOtp } from './modules/auth/verify-otp/verify-otp';
import { CompanyRegistration } from './modules/auth/company-registration/company-registration';
import { PatientRegistration } from './modules/patient/pages/patient-registration/patient-registration';
import { PatientList } from './modules/patient/pages/patient-list/patient-list';
import { Dashboard } from './modules/patient/pages/dashboad/dashboard/dashboard';
import { PatientDetails } from './modules/patient/pages/patient-details/patient-details';
import { UserManagement } from './modules/auth/user-management/user-management';
import { authGuard } from './@core/guards/auth-guard';

export const routes: Routes = [
  // Public Multi-Tenant Business Onboarding & Auth Routes
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ForgotPassword },
  { path: 'staff-registration', component: Signup },
  { path: 'signup', redirectTo: 'staff-registration', pathMatch: 'full' },
  { path: 'register', redirectTo: 'staff-registration', pathMatch: 'full' },
  { path: 'verify-otp', component: VerifyOtp },
  { path: 'account-registration', component: CompanyRegistration },
  { path: 'patient-login', component: PatientLogin },

  // Protected Routes
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },
  {
    path: 'users',
    component: UserManagement,
    canActivate: [authGuard]
  },
  {
    path: 'user-management',
    component: UserManagement,
    canActivate: [authGuard]
  },
  {
    path: 'patients',
    component: PatientList,
    canActivate: [authGuard]
  },
  {
    path: 'patient-registration',
    component: PatientRegistration,
    canActivate: [authGuard]
  },
  {
    path: 'patient-details',
    component: PatientDetails,
    canActivate: [authGuard]
  },

  // Default Redirect to Dashboard (which redirects to login if not authenticated)
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];


