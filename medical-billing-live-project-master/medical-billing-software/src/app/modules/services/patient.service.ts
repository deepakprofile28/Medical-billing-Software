import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patient {
  id?: number;

  name: string;
  mobile: string;
  email: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  maritalStatus: string;
  occupation: string;

  aadhaar: string;
  pan: string;

  emergencyContact: string;
  emergencyName: string;

  address1: string;
  address2: string;
  district: string;
  city: string;
  state: string;
  country: string;
  pincode: string;

  medicalHistory: string;
  currentMedication: string;
  allergies: string;

  insuranceProvider: string;
  policyNumber: string;
  policyHolderName: string;

  status?: string;
  createdDate?: string;

  company?: {
    id: number;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private apiUrl = 'http://localhost:8082/api/patients';

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // GET ALL PATIENTS
  // =====================================================

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(
      this.apiUrl
    );
  }

  // =====================================================
  // GET PATIENTS
  // Alias method for PatientList component
  // =====================================================

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(
      this.apiUrl
    );
  }

  // =====================================================
  // GET PATIENT BY ID
  // =====================================================

  getPatientById(
    id: number
  ): Observable<Patient> {

    return this.http.get<Patient>(
      `${this.apiUrl}/${id}`
    );
  }

  // =====================================================
  // CREATE PATIENT
  // =====================================================

  savePatient(
    patient: Patient
  ): Observable<Patient> {

    return this.http.post<Patient>(
      this.apiUrl,
      patient
    );
  }

  // =====================================================
  // UPDATE PATIENT
  // =====================================================

  updatePatient(
    id: number,
    patient: Patient
  ): Observable<Patient> {

    return this.http.put<Patient>(
      `${this.apiUrl}/${id}`,
      patient
    );
  }

  // =====================================================
  // DELETE PATIENT
  // =====================================================

  deletePatient(
    id: number
  ): Observable<string> {

    return this.http.delete<string>(
      `${this.apiUrl}/${id}`
    );
  }

  // =====================================================
  // SAVE DRAFT
  // =====================================================

  saveDraft(
    patient: Patient
  ): Observable<Patient> {

    return this.http.post<Patient>(
      `${this.apiUrl}/draft`,
      patient
    );
  }

  // =====================================================
  // GET DRAFT PATIENTS
  // =====================================================

  getDraftPatients(): Observable<Patient[]> {

    return this.http.get<Patient[]>(
      `${this.apiUrl}/drafts`
    );
  }

  // =====================================================
  // APPROVE DRAFT
  // =====================================================

  approvePatient(
    id: number
  ): Observable<Patient> {

    return this.http.put<Patient>(
      `${this.apiUrl}/${id}/approve`,
      {}
    );
  }

  // =====================================================
  // DELETE DRAFT
  // =====================================================

  deleteDraft(
    id: number
  ): Observable<string> {

    return this.http.delete<string>(
      `${this.apiUrl}/${id}/draft`
    );
  }
}