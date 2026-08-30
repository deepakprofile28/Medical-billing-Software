import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

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
  private readonly DRAFTS_KEY = 'medbill_patient_drafts';
  private readonly PATIENTS_KEY = 'medbill_registered_patients';

  constructor(
    private http: HttpClient
  ) {}

  // ================= LOCAL STORAGE HELPERS =================

  private getLocalDrafts(): Patient[] {
    try {
      const data = localStorage.getItem(this.DRAFTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalDraft(patient: Patient): Patient {
    const drafts = this.getLocalDrafts();
    if (!patient.id) {
      patient.id = Date.now();
    }
    patient.status = 'Draft';
    if (!patient.createdDate) {
      patient.createdDate = new Date().toISOString();
    }

    const index = drafts.findIndex(d => d.id === patient.id);
    if (index >= 0) {
      drafts[index] = patient;
    } else {
      drafts.unshift(patient);
    }

    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
    return patient;
  }

  private getLocalPatients(): Patient[] {
    try {
      const data = localStorage.getItem(this.PATIENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalPatient(patient: Patient): Patient {
    const patients = this.getLocalPatients();
    if (!patient.id) {
      patient.id = Date.now();
    }
    if (!patient.status) {
      patient.status = 'Active';
    }
    if (!patient.createdDate) {
      patient.createdDate = new Date().toISOString();
    }

    const index = patients.findIndex(p => p.id === patient.id);
    if (index >= 0) {
      patients[index] = patient;
    } else {
      patients.unshift(patient);
    }

    localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
    return patient;
  }

  // =====================================================
  // GET ALL PATIENTS
  // =====================================================

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl).pipe(
      tap((patients) => {
        if (Array.isArray(patients) && patients.length > 0) {
          localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
        }
      }),
      catchError(() => {
        console.warn('Backend patients API offline, returning local patients storage.');
        return of(this.getLocalPatients());
      })
    );
  }

  // =====================================================
  // GET PATIENTS (Alias)
  // =====================================================

  getPatients(): Observable<Patient[]> {
    return this.getAllPatients();
  }

  // =====================================================
  // GET PATIENT BY ID
  // =====================================================

  getPatientById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.getLocalPatients().find(p => p.id === id) ||
                      this.getLocalDrafts().find(d => d.id === id);
        if (found) {
          return of(found);
        }
        return throwError(() => new Error('Patient not found'));
      })
    );
  }

  // =====================================================
  // CREATE / SAVE PATIENT
  // =====================================================

  savePatient(patient: Patient): Observable<Patient> {
    // Save locally first
    const savedLocal = this.saveLocalPatient(patient);

    return this.http.post<Patient>(this.apiUrl, patient).pipe(
      tap((res) => {
        if (res && res.id) {
          this.saveLocalPatient(res);
        }
      }),
      catchError((err) => {
        console.warn('Backend save patient offline, saved in local session:', err);
        return of(savedLocal);
      })
    );
  }

  // =====================================================
  // UPDATE PATIENT
  // =====================================================

  updatePatient(id: number, patient: Patient): Observable<Patient> {
    patient.id = id;
    this.saveLocalPatient(patient);

    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient).pipe(
      catchError(() => of(patient))
    );
  }

  // =====================================================
  // DELETE PATIENT
  // =====================================================

  deletePatient(id: number): Observable<string> {
    const patients = this.getLocalPatients().filter(p => p.id !== id);
    localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));

    return this.http.delete<string>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of('Patient deleted successfully'))
    );
  }

  // =====================================================
  // SAVE DRAFT
  // =====================================================

  saveDraft(patient: Patient): Observable<Patient> {
    // Always store draft locally first
    const savedDraft = this.saveLocalDraft(patient);

    return this.http.post<Patient>(`${this.apiUrl}/draft`, patient).pipe(
      tap((res) => {
        if (res && res.id) {
          this.saveLocalDraft(res);
        }
      }),
      catchError((err) => {
        console.warn('Backend draft API offline or returned error, stored in local storage:', err);
        return of(savedDraft);
      })
    );
  }

  // =====================================================
  // GET DRAFT PATIENTS
  // =====================================================

  getDraftPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/drafts`).pipe(
      tap((drafts) => {
        if (Array.isArray(drafts)) {
          localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
        }
      }),
      catchError(() => {
        console.warn('Backend draft API offline, returning local drafts.');
        return of(this.getLocalDrafts());
      })
    );
  }

  // =====================================================
  // APPROVE DRAFT
  // =====================================================

  approvePatient(id: number): Observable<Patient> {
    const drafts = this.getLocalDrafts();
    const draftIndex = drafts.findIndex(d => d.id === id);
    let approvedPatient: Patient | undefined;

    if (draftIndex >= 0) {
      approvedPatient = drafts[draftIndex];
      approvedPatient.status = 'Active';
      drafts.splice(draftIndex, 1);
      localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
      this.saveLocalPatient(approvedPatient);
    }

    return this.http.put<Patient>(`${this.apiUrl}/${id}/approve`, {}).pipe(
      catchError(() => {
        if (approvedPatient) {
          return of(approvedPatient);
        }
        return of({ id, name: 'Patient', status: 'Active' } as Patient);
      })
    );
  }

  // =====================================================
  // DELETE DRAFT
  // =====================================================

  deleteDraft(id: number): Observable<string> {
    const drafts = this.getLocalDrafts().filter(d => d.id !== id);
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));

    return this.http.delete<string>(`${this.apiUrl}/${id}/draft`).pipe(
      catchError(() => of('Draft deleted successfully'))
    );
  }
}