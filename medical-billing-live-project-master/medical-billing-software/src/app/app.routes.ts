import { Routes } from '@angular/router';
import { PatientLogin } from './patient-login/patient-login';
import { Login } from './modules/auth/login/login';
import { PatientRegistration } from './modules/patient/pages/patient-registration/patient-registration';
import { AppCard } from './shared/components/app-card/app-card';
import { PatientForm } from './modules/patient/components/patient-form/patient-form';
import { PatientList } from './modules/patient/pages/patient-list/patient-list';
import { PatientDetails } from './modules/patient/pages/patient-details/patient-details';

export const routes: Routes = [
  // { path: 'patient-Registration', component: PatientLogin },
  // { path: '', redirectTo: 'PatientRegistration', pathMatch: 'full' },


  // { path: 'login', component: Login },
  //  { path: 'PatientRegistration', component: PatientRegistration },
  //     { path: 'Appcard', component: AppCard },
  {
    path: 'patients',
    component: PatientList
  },

  {
    path: 'patient-registration',
    component: PatientRegistration
  },

  {
    path: '',
    redirectTo: 'patients',
    pathMatch: 'full'
  }, 
  {
    path: 'patient-details',
    component: PatientDetails
  },

];

