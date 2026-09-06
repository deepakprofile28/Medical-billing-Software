import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Doctor {
  id?: number;
  name: string;
  specialization: string;
  qualification?: string;
  registrationNumber?: string;
  phone: string;
  email?: string;
  department?: string;
  roomNumber?: string;
  consultationFee?: number;
  experienceYears?: number;
  availableDays?: string;
  availableTimeStart?: string;
  availableTimeEnd?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  notes?: string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  private apiUrl = 'http://localhost:8082/api/doctors';

  constructor(private http: HttpClient) {}

  getAllDoctors(companyId?: number | string, activeOnly: boolean = false): Observable<Doctor[]> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.get<Doctor[]>(`${this.apiUrl}?companyId=${cid}&activeOnly=${activeOnly}`).pipe(
      catchError((err) => {
        console.error('Error loading doctors from MySQL backend:', err);
        return of([] as Doctor[]);
      })
    );
  }

  getDoctorById(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
  }

  createDoctor(doctor: Doctor, companyId?: number | string): Observable<Doctor> {
    const cid = companyId || localStorage.getItem('companyId') || '1';
    return this.http.post<Doctor>(`${this.apiUrl}?companyId=${cid}`, doctor);
  }

  updateDoctor(id: number, doctor: Doctor): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${id}`, doctor);
  }

  deleteDoctor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

