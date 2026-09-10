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
import { PosBilling } from './modules/patient/pages/pos-billing/pos-billing';
import { TabletsInventory } from './modules/patient/pages/tablets-inventory/tablets-inventory';
import { StoreSettings } from './modules/patient/pages/store-settings/store-settings';
import { TaxSettings } from './modules/patient/pages/tax-settings/tax-settings';
import { CategorySettings } from './modules/patient/pages/category-settings/category-settings';
import { RoleSettings } from './modules/patient/pages/role-settings/role-settings';
import { AccessSettings } from './modules/patient/pages/access-settings/access-settings';
import { AiAssistant } from './modules/patient/pages/ai-assistant/ai-assistant';
import { DoctorList } from './modules/patient/pages/doctor-list/doctor-list';
import { DoctorRegistration } from './modules/patient/pages/doctor-registration/doctor-registration';
import { WarehouseSettings } from './modules/patient/pages/warehouse-settings/warehouse-settings';
import { BrandSettings } from './modules/patient/pages/brand-settings/brand-settings';
import { BranchSettings } from './modules/patient/pages/branch-settings/branch-settings';
import { SalesTransactionPage } from './modules/patient/pages/sales-transaction/sales-transaction';
import { SalesOrderPage } from './modules/patient/pages/sales-order/sales-order';
import { SalesSuspendedPage } from './modules/patient/pages/sales-suspended/sales-suspended';
import { SalesCompletedPage } from './modules/patient/pages/sales-completed/sales-completed';
import { SalesExchangePage } from './modules/patient/pages/sales-exchange/sales-exchange';
import { SalesReturnsPage } from './modules/patient/pages/sales-returns/sales-returns';
import { authGuard } from './@core/guards/auth-guard';

import { RackSettings } from './modules/patient/pages/rack-settings/rack-settings';


import { PurchaseList } from './modules/patient/pages/purchase/purchase-list/purchase-list';
import { PurchaseReturnsList } from './modules/patient/pages/purchase-returns/purchase-returns-list/purchase-returns-list';
import { SupplierManagement } from './modules/patient/pages/supplier-management/supplier-management';
import { SupplierRegistration } from './modules/patient/pages/supplier-registration/supplier-registration';

export const routes: Routes = [
  {
    path: 'rack',
    component: RackSettings,
    canActivate: [authGuard]
  },
  {
    path: 'racks',
    redirectTo: 'rack',
    pathMatch: 'full'
  },
  {
    path: 'rack-settings',
    redirectTo: 'rack',
    pathMatch: 'full'
  },

  // Purchase & Returns Routes
  {
    path: 'purchase',
    component: PurchaseList,
    canActivate: [authGuard]
  },
  {
    path: 'purchase-returns',
    component: PurchaseReturnsList,
    canActivate: [authGuard]
  },

  // Supplier Management Routes
  {
    path: 'supplier-list',
    component: SupplierManagement,
    canActivate: [authGuard]
  },
  {
    path: 'suppliers',
    redirectTo: 'supplier-list',
    pathMatch: 'full'
  },
  {
    path: 'supplier-management',
    redirectTo: 'supplier-list',
    pathMatch: 'full'
  },
  {
    path: 'supplier',
    redirectTo: 'supplier-list',
    pathMatch: 'full'
  },
  {
    path: 'supplier-registration',
    component: SupplierRegistration,
    canActivate: [authGuard]
  },
  {
    path: 'add-supplier',
    redirectTo: 'supplier-registration',
    pathMatch: 'full'
  },

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
    path: 'tablets',
    component: TabletsInventory,
    canActivate: [authGuard]
  },
  {
    path: 'medicines',
    redirectTo: 'tablets',
    pathMatch: 'full'
  },
  {
    path: 'pos',
    component: PosBilling,
    canActivate: [authGuard]
  },
  {
    path: 'pos-billing',
    redirectTo: 'pos',
    pathMatch: 'full'
  },
  {
    path: 'billing-pos',
    redirectTo: 'pos',
    pathMatch: 'full'
  },
  {
    path: 'pos-villing',
    redirectTo: 'pos',
    pathMatch: 'full'
  },
  {
    path: 'billing',
    redirectTo: 'pos',
    pathMatch: 'full'
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
    path: 'settings',
    component: StoreSettings,
    canActivate: [authGuard]
  },
  {
    path: 'store-settings',
    redirectTo: 'settings',
    pathMatch: 'full'
  },
  {
    path: 'tax',
    component: TaxSettings,
    canActivate: [authGuard]
  },
  {
    path: 'taxes',
    redirectTo: 'tax',
    pathMatch: 'full'
  },
  {
    path: 'tax-settings',
    redirectTo: 'tax',
    pathMatch: 'full'
  },
  {
    path: 'category',
    component: CategorySettings,
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    redirectTo: 'category',
    pathMatch: 'full'
  },
  {
    path: 'category-settings',
    redirectTo: 'category',
    pathMatch: 'full'
  },
  {
    path: 'warehouse',
    component: WarehouseSettings,
    canActivate: [authGuard]
  },
  {
    path: 'warehouses',
    redirectTo: 'warehouse',
    pathMatch: 'full'
  },
  {
    path: 'brand',
    component: BrandSettings,
    canActivate: [authGuard]
  },
  {
    path: 'brands',
    redirectTo: 'brand',
    pathMatch: 'full'
  },
  {
    path: 'branch',
    component: BranchSettings,
    canActivate: [authGuard]
  },
  {
    path: 'branches',
    redirectTo: 'branch',
    pathMatch: 'full'
  },
  // Sales Sub-Modules
  {
    path: 'sales-transactions',
    component: SalesTransactionPage,
    canActivate: [authGuard]
  },
  {
    path: 'sales/transactions',
    redirectTo: 'sales-transactions',
    pathMatch: 'full'
  },
  {
    path: 'sales-orders',
    component: SalesOrderPage,
    canActivate: [authGuard]
  },
  {
    path: 'sales/orders',
    redirectTo: 'sales-orders',
    pathMatch: 'full'
  },
  {
    path: 'sales-suspended',
    component: SalesSuspendedPage,
    canActivate: [authGuard]
  },
  {
    path: 'sales/suspended',
    redirectTo: 'sales-suspended',
    pathMatch: 'full'
  },
  {
    path: 'sales-completed',
    component: SalesCompletedPage,
    canActivate: [authGuard]
  },
  {
    path: 'sales/completed',
    redirectTo: 'sales-completed',
    pathMatch: 'full'
  },
  {
    path: 'sales-exchange',
    component: SalesExchangePage,
    canActivate: [authGuard]
  },
  {
    path: 'sales/exchange',
    redirectTo: 'sales-exchange',
    pathMatch: 'full'
  },
  {
    path: 'sales-returns',
    component: SalesReturnsPage,
    canActivate: [authGuard]
  },
  {
    path: 'sales/returns',
    redirectTo: 'sales-returns',
    pathMatch: 'full'
  },
  {
    path: 'roles',
    component: RoleSettings,
    canActivate: [authGuard]
  },
  {
    path: 'role',
    redirectTo: 'roles',
    pathMatch: 'full'
  },
  {
    path: 'role-settings',
    redirectTo: 'roles',
    pathMatch: 'full'
  },
  {
    path: 'access',
    component: AccessSettings,
    canActivate: [authGuard]
  },
  {
    path: 'access-management',
    redirectTo: 'access',
    pathMatch: 'full'
  },
  {
    path: 'access-settings',
    redirectTo: 'access',
    pathMatch: 'full'
  },
  {
    path: 'ai-assistant',
    component: AiAssistant,
    canActivate: [authGuard]
  },
  {
    path: 'ai',
    redirectTo: 'ai-assistant',
    pathMatch: 'full'
  },
  // Doctor Management Routes
  {
    path: 'doctors',
    component: DoctorList,
    canActivate: [authGuard]
  },
  {
    path: 'doctor-list',
    redirectTo: 'doctors',
    pathMatch: 'full'
  },
  {
    path: 'add-doctor',
    component: DoctorRegistration,
    canActivate: [authGuard]
  },
  {
    path: 'doctor-registration',
    redirectTo: 'add-doctor',
    pathMatch: 'full'
  },
  {
    path: 'edit-doctor/:id',
    component: DoctorRegistration,
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


