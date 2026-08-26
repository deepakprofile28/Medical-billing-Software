import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  // ==========================================
  // API URL
  // ==========================================

  private apiUrl = 'http://localhost:8082/api/patients';

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private http: HttpClient
  ) {}

  // ==========================================
  // GET ALL PATIENTS
  // ==========================================

  getPatients(): Observable<any[]> {

    return this.http.get<any[]>(
      this.apiUrl
    );
  }

  // ==========================================
  // GET PATIENT BY ID
  // ==========================================

  getPatientById(
    id: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );
  }

  // ==========================================
  // SAVE PATIENT
  // ==========================================

  savePatient(
    patient: any
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      patient
    );
  }

  // ==========================================
  // UPDATE PATIENT
  // ==========================================

  updatePatient(
    id: number,
    patient: any
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      patient
    );
  }

  // ==========================================
  // DELETE PATIENT
  // ==========================================

  deletePatient(
    id: number
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );
  }

  // ==========================================
  // GET DRAFT PATIENTS
  // ==========================================

  getDraftPatients(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/drafts`
    );
  }

  // ==========================================
  // APPROVE DRAFT PATIENT
  // ==========================================

  approvePatient(
    id: number
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${id}/approve`,
      {}
    );
  }

  // ==========================================
  // DELETE DRAFT
  // ==========================================

  deleteDraft(
    id: number
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}/draft`
    );
  }

  // ==========================================
  // SAVE PATIENT AS DRAFT
  // ==========================================

  saveDraft(
    patient: any
  ): Observable<any> {

    // Create a new object so that
    // original form data is not modified

    const draftData = {
      ...patient,

      // Empty DOB → null
      dob: patient.dob || null
    };

    console.log(
      'Sending Draft Data:',
      draftData
    );

    return this.http.post<any>(
      `${this.apiUrl}/draft`,
      draftData
    );
  }
}