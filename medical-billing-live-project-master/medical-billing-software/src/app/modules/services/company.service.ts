import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

export interface Company {
  id?: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  status?: string; // 'ACTIVE', 'INACTIVE'
  createdAt?: string;
  password?: string;
  plan?: number | string;
  renewalDate?: string;
}

export interface CompanyRegistrationResponse {
  success: boolean;
  message: string;
  company: Company;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  // Primary backend API URL (matches Spring Boot server)
  private apiUrl = 'http://localhost:8082/api/companies';
  private readonly COMPANIES_STORAGE_KEY = 'medbill_companies';

  constructor(private http: HttpClient) {}

  // ================= GET LOCAL STORAGE COMPANIES =================
  getLocalCompanies(): Company[] {
    try {
      const data = localStorage.getItem(this.COMPANIES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Initial default companies
      const initialCompanies: Company[] = [
        {
          id: 1,
          name: 'Medical Billing Company',
          email: 'admin@medicalbilling.com',
          mobile: '9876543210',
          address: 'Chennai',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          plan: 1
        },
        {
          id: 2,
          name: 'Medical Company 2',
          email: 'company2@gmail.com',
          mobile: '9876543210',
          address: 'Chennai',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          plan: 1
        }
      ];
      localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(initialCompanies));
      return initialCompanies;
    } catch {
      return [];
    }
  }

  // ================= SAVE COMPANY LOCALLY =================
  private saveLocalCompany(company: Company): Company {
    const companies = this.getLocalCompanies();
    if (!company.id) {
      company.id = companies.length > 0 ? Math.max(...companies.map(c => c.id || 0)) + 1 : 1;
    }
    if (!company.status) {
      company.status = 'ACTIVE';
    }
    if (!company.createdAt) {
      company.createdAt = new Date().toISOString();
    }

    const index = companies.findIndex(c => c.id === company.id || c.email?.toLowerCase() === company.email?.toLowerCase());
    if (index >= 0) {
      companies[index] = { ...companies[index], ...company };
    } else {
      companies.unshift(company);
    }

    localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(companies));
    return company;
  }

  // ================= CREATE / REGISTER COMPANY (POST /api/companies) =================
  createCompany(company: Company): Observable<Company> {
    // 1. Always save in local storage for offline / quick access
    const savedLocal = this.saveLocalCompany({ ...company });

    // 2. Post to Spring Boot Backend API
    return this.http.post<Company>(this.apiUrl, company).pipe(
      tap((createdCompany) => {
        console.log('Company created in Spring Boot backend successfully:', createdCompany);
        this.saveLocalCompany(createdCompany);
      }),
      catchError((error) => {
        console.warn('Backend /api/companies not reachable or returned error. Saved to local storage:', error);
        // Return locally saved company so the registration flow completes smoothly
        return of(savedLocal);
      })
    );
  }

  // ================= GET ALL COMPANIES (GET /api/companies) =================
  getAllCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl).pipe(
      tap((companies) => {
        if (companies && Array.isArray(companies) && companies.length > 0) {
          localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(companies));
        }
      }),
      catchError((err) => {
        console.warn('Backend failed, loading companies from local storage:', err);
        return of(this.getLocalCompanies());
      })
    );
  }

  // ================= GET COMPANY BY ID (GET /api/companies/{id}) =================
  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        console.warn(`Backend failed for company ID ${id}, looking in local storage:`, err);
        const local = this.getLocalCompanies().find(c => c.id === id);
        if (local) {
          return of(local);
        }
        return throwError(() => new Error(`Company with ID ${id} not found`));
      })
    );
  }

  // ================= UPDATE COMPANY (PUT /api/companies/{id}) =================
  updateCompany(id: number, company: Partial<Company>): Observable<Company> {
    const companies = this.getLocalCompanies();
    const index = companies.findIndex(c => c.id === id);
    let updated: Company = { ...company } as Company;

    if (index >= 0) {
      companies[index] = { ...companies[index], ...company };
      updated = companies[index];
      localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(companies));
    }

    return this.http.put<Company>(`${this.apiUrl}/${id}`, company).pipe(
      catchError((err) => {
        console.warn('Backend update failed, updated locally:', err);
        return of(updated);
      })
    );
  }

  // ================= DELETE COMPANY (DELETE /api/companies/{id}) =================
  deleteCompany(id: number): Observable<any> {
    let companies = this.getLocalCompanies();
    companies = companies.filter(c => c.id !== id);
    localStorage.setItem(this.COMPANIES_STORAGE_KEY, JSON.stringify(companies));

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        console.warn('Backend delete failed, deleted from local storage:', err);
        return of({ success: true, message: 'Deleted locally' });
      })
    );
  }
}

