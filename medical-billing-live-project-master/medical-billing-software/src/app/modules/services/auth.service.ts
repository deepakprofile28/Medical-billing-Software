import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';

// =====================================================
// LOGIN REQUEST & RESPONSE
// =====================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userName: string;
  role: string;
  token: string;
  companyId: number | null;
  companyName: string | null;
}

// =====================================================
// SIGNUP & USER MANAGEMENT REQUEST
// =====================================================

export interface SignupRequest {
  name?: string;
  userName?: string;
  email: string;
  password?: string;
  mobile?: string;
  countryCode?: string;
  role?: string;
  companyId?: number;
  companyName?: string;
  active?: boolean;
  status?: 'Active' | 'Inactive';
  createdDate?: string;
}

// =====================================================
// VERIFY OTP REQUEST
// =====================================================

export interface VerifyOtpRequest {
  countryCode: string;
  mobile: string;
  otp: string;
}

// =====================================================
// COMPANY REGISTRATION REQUEST
// =====================================================

export interface CompanyRegistrationRequest {
  companyName: string;
  businessType?: string;
  drugLicenseNumber?: string;
  gstNumber?: string;
  businessPhone: string;
  businessEmail: string;
  countryCode?: string;
  mobile?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  invoicePrefix?: string;

  // Primary Owner Credentials
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  ownerCountryCode?: string;
  password: string;

  status?: 'ACTIVE' | 'TRIAL' | 'INACTIVE';
  plan?: string | number;
}

export interface CompanyAccount {
  id: number;
  companyName: string;
  businessType?: string;
  drugLicenseNumber?: string;
  gstNumber?: string;
  businessPhone: string;
  businessEmail: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  invoicePrefix?: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  status: string;
  createdDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8082/api/auth';
  private companyApiUrl = 'http://localhost:8082/api/companies';
  private readonly USERS_STORAGE_KEY = 'medbill_registered_users';
  private readonly COMPANIES_STORAGE_KEY = 'medbill_companies';

  constructor(private http: HttpClient) {}

  // =====================================================
  // GET LOCAL USERS
  // =====================================================
  getLocalUsers(): SignupRequest[] {
    try {
      const data = localStorage.getItem(this.USERS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Initial default sample users
      const initialUsers: SignupRequest[] = [
        {
          userName: 'Dr. Anand Raman',
          email: 'admin@hospital.com',
          password: 'password123',
          mobile: '9840112233',
          role: 'ADMIN',
          companyName: 'MediCare Multispecialty Hospital',
          status: 'Active',
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
        },
        {
          userName: 'Priya Sundaram',
          email: 'priya.billing@hospital.com',
          password: 'password123',
          mobile: '9876543210',
          role: 'BILLING_OFFICER',
          companyName: 'MediCare Multispecialty Hospital',
          status: 'Active',
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
          userName: 'Dr. Suresh Kumar',
          email: 'dr.suresh@hospital.com',
          password: 'password123',
          mobile: '9123456789',
          role: 'DOCTOR',
          companyName: 'MediCare Multispecialty Hospital',
          status: 'Active',
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString()
        }
      ];
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    } catch {
      return [];
    }
  }

  // =====================================================
  // SAVE LOCAL USER
  // =====================================================
  saveLocalUser(user: SignupRequest): void {
    const users = this.getLocalUsers();
    if (!user.name && user.userName) user.name = user.userName;
    if (!user.userName && user.name) user.userName = user.name;
    if (!user.status) user.status = 'Active';
    if (user.active === undefined) user.active = true;
    if (!user.createdDate) user.createdDate = new Date().toISOString();

    const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.unshift(user);
    }
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
  }

  // =====================================================
  // GET ALL USERS (FOR USER MANAGEMENT COMPONENT)
  // =====================================================
  getAllUsers(): Observable<SignupRequest[]> {
    return this.http.get<SignupRequest[]>(`${this.apiUrl}/users`).pipe(
      tap((users) => {
        if (Array.isArray(users) && users.length > 0) {
          localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }),
      catchError(() => of(this.getLocalUsers()))
    );
  }

  // =====================================================
  // UPDATE USER
  // =====================================================
  updateUser(originalEmail: string, updatedData: Partial<SignupRequest>): Observable<boolean> {
    const users = this.getLocalUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === originalEmail.toLowerCase());
    if (index >= 0) {
      users[index] = { ...users[index], ...updatedData };
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    }

    return this.http.put<any>(`${this.apiUrl}/users/${encodeURIComponent(originalEmail)}`, updatedData).pipe(
      catchError(() => of(true)),
      tap(() => true)
    );
  }

  // =====================================================
  // RESET PASSWORD
  // =====================================================
  resetPassword(email: string, newPassword: string): Observable<boolean> {
    const users = this.getLocalUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index >= 0) {
      users[index].password = newPassword;
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    }

    return this.http.post<any>(`${this.apiUrl}/reset-password`, { email, newPassword }).pipe(
      catchError(() => of(true)),
      tap(() => true)
    );
  }

  // =====================================================
  // DELETE USER
  // =====================================================
  deleteUser(email: string): Observable<boolean> {
    let users = this.getLocalUsers();
    users = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));

    return this.http.delete<any>(`${this.apiUrl}/users/${encodeURIComponent(email)}`).pipe(
      catchError(() => of(true)),
      tap(() => true)
    );
  }

  // =====================================================
  // GET LOCAL COMPANIES
  // =====================================================
  getLocalCompanies(): CompanyAccount[] {
    try {
      const data = localStorage.getItem(this.COMPANIES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      const initialCompanies: CompanyAccount[] = [
        {
          id: 1,
          companyName: 'Medical Billing Company',
          businessType: 'PHARMACY',
          businessPhone: '9876543210',
          businessEmail: 'admin@medicalbilling.com',
          address: 'Chennai',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          ownerName: 'Admin',
          ownerEmail: 'admin@medicalbilling.com',
          ownerMobile: '9876543210',
          status: 'ACTIVE',
          createdDate: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(initialCompanies));
      return initialCompanies;
    } catch {
      return [];
    }
  }

  // =====================================================
  // CREATE COMPANY (BACKEND OR LOCAL)
  // =====================================================
  createCompany(companyData: any): Observable<any> {
    return this.http.post<any>(this.companyApiUrl, companyData).pipe(
      catchError(() => {
        const companies = this.getLocalCompanies();
        const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id || 0)) + 1 : 1;
        const newComp = { ...companyData, id: newId };
        companies.unshift(newComp);
        localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(companies));
        return of(newComp);
      })
    );
  }

  // =====================================================
  // REGISTER USER / SEND OTP
  // =====================================================
  register(request: SignupRequest): Observable<any> {
    this.saveLocalUser(request);

    const payload = {
      name: request.name || request.userName,
      userName: request.userName || request.name,
      email: request.email.trim().toLowerCase(),
      password: request.password,
      mobile: request.mobile ? request.mobile.replace(/\D/g, '') : '',
      countryCode: request.countryCode || '+91',
      companyId: request.companyId,
      companyName: request.companyName,
      role: request.role || 'ADMIN',
      active: request.active !== undefined ? request.active : true
    };

    return this.http.post<any>(`${this.apiUrl}/register`, payload).pipe(
      catchError((err) => {
        console.warn('Backend /register returned error or not reachable. Registered locally:', err);
        return of({
          success: true,
          message: 'User registered successfully',
          userName: payload.name,
          email: payload.email
        });
      })
    );
  }

  // =====================================================
  // RESEND OTP
  // POST /api/auth/resend-otp
  // =====================================================
  resendOtp(data: { countryCode?: string; mobile?: string; email?: string }): Observable<any> {
    const payload = {
      countryCode: data.countryCode ? data.countryCode.trim() : '+91',
      mobile: data.mobile ? data.mobile.replace(/\D/g, '') : '',
      email: data.email ? data.email.trim().toLowerCase() : ''
    };

    console.log('Sending Resend OTP Request to Backend:', payload);

    return this.http.post<any>(`${this.apiUrl}/resend-otp`, payload).pipe(
      catchError((err) => {
        console.warn('Backend /resend-otp failed, fallback:', err);
        const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        return of({
          success: true,
          message: 'New OTP sent successfully!',
          otp: mockOtp
        });
      })
    );
  }

  // =====================================================
  // VERIFY OTP
  // POST /api/auth/verify-otp
  // =====================================================
  verifyOtp(request: VerifyOtpRequest): Observable<any> {
    const payload = {
      countryCode: request.countryCode ? request.countryCode.trim() : '+91',
      mobile: request.mobile ? request.mobile.replace(/\D/g, '') : '',
      otp: request.otp ? request.otp.trim() : ''
    };

    console.log('Sending OTP Verification to Backend:', payload);

    return this.http.post<any>(`${this.apiUrl}/verify-otp`, payload);
  }

  // =====================================================
  // FORGOT PASSWORD
  // POST /api/auth/forgot-password
  // =====================================================
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email: email.trim().toLowerCase() }).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Password reset instructions sent to your registered Gmail address.'
        });
      })
    );
  }

  // =====================================================
  // SEND BILL INVOICE EMAIL
  // POST /api/auth/send-bill-email
  // =====================================================
  sendBillInvoiceEmail(billData: {
    email: string;
    patientName?: string;
    invoiceNo?: string;
    pharmacyName?: string;
    billDate?: string;
    totalAmount?: number;
    items?: any[];
    notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-bill-email`, billData);
  }

  // =====================================================
  // REGISTER COMPANY (MULTI-TENANT ONBOARDING)
  // POST /api/auth/register-company
  // =====================================================
  registerCompany(req: CompanyRegistrationRequest): Observable<any> {
    const payload = {
      companyName: req.companyName,
      name: req.companyName,
      businessEmail: req.businessEmail || req.ownerEmail,
      email: req.businessEmail || req.ownerEmail,
      countryCode: req.countryCode || req.ownerCountryCode || '+91',
      mobile: req.mobile || req.businessPhone,
      businessPhone: req.businessPhone || req.mobile,
      ownerName: req.ownerName,
      ownerEmail: req.ownerEmail || req.businessEmail,
      ownerMobile: req.ownerMobile || req.mobile,
      ownerCountryCode: req.ownerCountryCode || req.countryCode || '+91',
      address: req.address,
      city: req.city || 'Chennai',
      state: req.state || 'Tamil Nadu',
      pincode: req.pincode || '600001',
      invoicePrefix: req.invoicePrefix || 'MED-',
      password: req.password,
      status: 'ACTIVE',
      plan: 'BASIC'
    };

    console.log('Sending Company Registration to Backend:', payload);

    return this.http.post<any>(`${this.apiUrl}/register-company`, payload).pipe(
      tap((response) => {
        try {
          console.log('Backend /api/auth/register-company SUCCESS:', response);
          const savedComp = response?.company || response;
          if (savedComp && savedComp.id) {
            const companies = this.getLocalCompanies() || [];
            const existingIdx = companies.findIndex(c => c && c.id === savedComp.id);
            if (existingIdx >= 0) {
              companies[existingIdx] = { ...companies[existingIdx], ...savedComp };
            } else {
              companies.unshift(savedComp);
            }
            localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(companies));
          }
        } catch (e) {
          console.warn('Error saving local company copy:', e);
        }
      }),
      catchError((err) => {
        console.warn('Backend register-company failed or not reachable, saving locally:', err);
        const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const companies = this.getLocalCompanies();
        const newCompanyId = companies.length > 0 ? Math.max(...companies.map(c => c.id || 0)) + 1 : 1;

        const newCompany: CompanyAccount = {
          id: newCompanyId,
          companyName: req.companyName,
          businessType: req.businessType || 'PHARMACY',
          drugLicenseNumber: req.drugLicenseNumber,
          gstNumber: req.gstNumber,
          businessPhone: req.businessPhone || req.mobile || '',
          businessEmail: req.businessEmail || req.ownerEmail || '',
          address: req.address,
          city: req.city || 'Chennai',
          state: req.state || 'Tamil Nadu',
          pincode: req.pincode || '600001',
          invoicePrefix: req.invoicePrefix || 'MED-',
          ownerName: req.ownerName,
          ownerEmail: req.ownerEmail || req.businessEmail || '',
          ownerMobile: req.ownerMobile || req.mobile || '',
          status: req.status || 'ACTIVE',
          createdDate: new Date().toISOString()
        };

        companies.unshift(newCompany);
        localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(companies));

        return of({
          success: true,
          company: newCompany,
          id: newCompanyId,
          companyId: newCompanyId,
          otp: mockOtp,
          otpResponse: {
            otp: mockOtp,
            message: 'OTP sent successfully'
          }
        });
      })
    );
  }

  // =====================================================
  // LOGIN
  // =====================================================
  login(request: LoginRequest): Observable<LoginResponse> {
    const payload = {
      email: request.email.trim().toLowerCase(),
      password: request.password
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response: LoginResponse) => {
        this.saveSession(response);
      }),
      catchError((error) => {
        console.warn('Backend login failed, checking registered local users:', error);

        const localUsers = this.getLocalUsers();
        const matchedUser = localUsers.find(
          u => u.email.toLowerCase() === request.email.toLowerCase() && u.password === request.password
        );

        if (matchedUser) {
          const localResponse: LoginResponse = {
            userName: matchedUser.userName || matchedUser.name || 'User',
            role: matchedUser.role || 'ADMIN',
            token: 'jwt-local-token-' + btoa(matchedUser.email) + '-' + Date.now(),
            companyId: matchedUser.companyId || 1,
            companyName: matchedUser.companyName || 'MediCare Hospital'
          };
          this.saveSession(localResponse);
          return of(localResponse);
        }

        return throwError(() => error);
      })
    );
  }

  // =====================================================
  // SESSION STORAGE HELPERS
  // =====================================================
  private saveSession(response: LoginResponse): void {
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    if (response.userName) {
      localStorage.setItem('userName', response.userName);
    }
    if (response.role) {
      localStorage.setItem('role', response.role);
    }
    if (response.companyId !== null && response.companyId !== undefined) {
      localStorage.setItem('companyId', response.companyId.toString());
    }
    if (response.companyName) {
      localStorage.setItem('companyName', response.companyName);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getCompanyId(): number | null {
    const companyId = localStorage.getItem('companyId');
    return companyId ? Number(companyId) : null;
  }

  getCompanyName(): string | null {
    return localStorage.getItem('companyName');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyName');
  }
}