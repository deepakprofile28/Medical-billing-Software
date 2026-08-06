import { Routes } from '@angular/router';
import { PatientLogin } from './patient-login/patient-login';
import { Login } from './modules/auth/login/login';
import { PatientRegistration } from './modules/patient/pages/patient-registration/patient-registration';
import { AppCard } from './shared/components/app-card/app-card';

export const routes: Routes = [
  { path: 'patient-Registration', component: PatientLogin },
  { path: '', redirectTo: 'patient-Registration', pathMatch: 'full' },


  { path: 'login', component: Login },
   { path: 'PatientRegistration', component: PatientRegistration },
      { path: 'App-Card', component: AppCard },

];
