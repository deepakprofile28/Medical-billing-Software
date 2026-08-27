import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8082/api/auth';

  constructor(private http: HttpClient) {}

  // ================= LOGIN =================

  login(request: LoginRequest): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        request
      )
      .pipe(

        tap((response: LoginResponse) => {

          // ================= SAVE JWT =================

          localStorage.setItem(
            'token',
            response.token
          );

          // ================= SAVE USER =================

          localStorage.setItem(
            'userName',
            response.userName
          );

          localStorage.setItem(
            'role',
            response.role
          );

          // ================= SAVE COMPANY =================

          if (response.companyId !== null) {

            localStorage.setItem(
              'companyId',
              response.companyId.toString()
            );
          }

          if (response.companyName !== null) {

            localStorage.setItem(
              'companyName',
              response.companyName
            );
          }

          // ================= DEBUG =================

          console.log(
            'JWT Token saved successfully'
          );

          console.log(
            'User:',
            response.userName
          );

          console.log(
            'Role:',
            response.role
          );

          console.log(
            'Company ID:',
            response.companyId
          );

          console.log(
            'Company Name:',
            response.companyName
          );

        })
      );
  }

  // ================= GET TOKEN =================

  getToken(): string | null {

    return localStorage.getItem('token');
  }

  // ================= CHECK LOGIN =================

  isLoggedIn(): boolean {

    return !!this.getToken();
  }

  // ================= USER DETAILS =================

  getUserName(): string | null {

    return localStorage.getItem('userName');
  }

  getRole(): string | null {

    return localStorage.getItem('role');
  }

  // ================= COMPANY DETAILS =================

  getCompanyId(): number | null {

    const companyId =
      localStorage.getItem('companyId');

    return companyId
      ? Number(companyId)
      : null;
  }

  getCompanyName(): string | null {

    return localStorage.getItem('companyName');
  }

  // ================= LOGOUT =================

  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyName');
  }
}