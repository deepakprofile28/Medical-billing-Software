import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

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
    const draftCopy: Patient = { ...patient };
    if (!draftCopy.id) {
      draftCopy.id = Date.now();
    }
    draftCopy.status = 'Draft';
    if (!draftCopy.createdDate) {
      draftCopy.createdDate = new Date().toISOString();
    }

    const index = drafts.findIndex(d => d.id === draftCopy.id);
    if (index >= 0) {
      drafts[index] = draftCopy;
    } else {
      drafts.unshift(draftCopy);
    }

    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
    return draftCopy;
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
    const patientCopy: Patient = { ...patient };
    if (!patientCopy.id) {
      patientCopy.id = Date.now();
    }
    if (!patientCopy.status) {
      patientCopy.status = 'Active';
    }
    if (!patientCopy.createdDate) {
      patientCopy.createdDate = new Date().toISOString();
    }

    // Deduplicate by id OR by name + email
    const index = patients.findIndex(p => 
      (p.id && p.id === patientCopy.id) ||
      (patientCopy.name && p.name && p.name.trim().toLowerCase() === patientCopy.name.trim().toLowerCase() && 
       p.email && patientCopy.email && p.email.trim().toLowerCase() === patientCopy.email.trim().toLowerCase())
    );

    if (index >= 0) {
      patients[index] = { ...patients[index], ...patientCopy };
    } else {
      patients.unshift(patientCopy);
    }

    localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
    return patientCopy;
  }

  // =====================================================
  // GET ALL PATIENTS
  // =====================================================

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl).pipe(
      map((backendPatients) => {
        const bList = Array.isArray(backendPatients) ? backendPatients : [];
        const localPatients = this.getLocalPatients();

        const mergedMap = new Map<string, Patient>();

        // Real Database patients from MySQL take highest precedence
        for (const p of bList) {
          if (p && p.id) {
            const key = p.name ? `${p.name.trim().toLowerCase()}_${(p.email || '').trim().toLowerCase()}` : `id_${p.id}`;
            mergedMap.set(key, p);
          }
        }

        // Add local only if not already saved to database
        for (const p of localPatients) {
          if (p && p.id) {
            const key = p.name ? `${p.name.trim().toLowerCase()}_${(p.email || '').trim().toLowerCase()}` : `id_${p.id}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, p);
            }
          }
        }

        const combined = Array.from(mergedMap.values());
        localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(combined));
        return combined;
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
  // PREPARE BACKEND PAYLOAD HELPER
  // =====================================================

  private prepareBackendPayload(patient: any, targetStatus: 'APPROVED' | 'DRAFT'): any {
    const payload: any = { ...patient };

    // Remove local temporary ID
    if (payload.id && payload.id > 1000000000000) {
      delete payload.id;
    }

    // Set correct enum status
    payload.status = targetStatus;

    // Fix DOB format: "YYYY-MM-DD" or null (never empty string "")
    if (payload.dob) {
      if (typeof payload.dob === 'string' && payload.dob.trim() === '') {
        payload.dob = null;
      } else if (typeof payload.dob === 'string' && payload.dob.includes('T')) {
        payload.dob = payload.dob.split('T')[0];
      }
    } else {
      payload.dob = null;
    }

    // Remove client-only createdDate so backend sets LocalDateTime.now()
    delete payload.createdDate;

    // Default name if blank
    if (!payload.name || payload.name.trim() === '') {
      payload.name = targetStatus === 'DRAFT' ? 'Draft Patient' : 'Registered Patient';
    }

    return payload;
  }

  // =====================================================
  // CREATE / SAVE PATIENT
  // =====================================================

  savePatient(patient: Patient): Observable<Patient> {
    const localPatient = this.saveLocalPatient(patient);
    const payload = this.prepareBackendPayload(patient, 'APPROVED');

    console.log('Sending clean Patient payload to Backend POST /api/patients:', payload);

    return this.http.post<Patient>(this.apiUrl, payload).pipe(
      tap((res) => {
        if (res && res.id) {
          console.log('Patient saved into Backend MySQL DB successfully! ID:', res.id);
          const patients = this.getLocalPatients().filter(p => p.id !== localPatient.id && p.id !== res.id);
          patients.unshift(res);
          localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
        }
      }),
      catchError((err) => {
        console.warn('Backend save patient offline, saved in local session:', err);
        return of(localPatient);
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
    const localDraft = this.saveLocalDraft(patient);
    const payload = this.prepareBackendPayload(patient, 'DRAFT');

    console.log('Sending Draft Patient payload to Backend POST /api/patients/draft:', payload);

    return this.http.post<Patient>(`${this.apiUrl}/draft`, payload).pipe(
      tap((res) => {
        if (res && res.id) {
          console.log('Draft saved into Backend MySQL DB successfully! ID:', res.id);
          const drafts = this.getLocalDrafts().filter(d => d.id !== localDraft.id && d.id !== res.id);
          drafts.unshift(res);
          localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
        }
      }),
      catchError((err) => {
        console.warn('Backend draft API offline or returned error, stored in local storage:', err);
        return of(localDraft);
      })
    );
  }

  // =====================================================
  // GET DRAFT PATIENTS
  // =====================================================

  getDraftPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/drafts`).pipe(
      map((drafts) => {
        const localDrafts = this.getLocalDrafts();
        if (!Array.isArray(drafts) || drafts.length === 0) {
          return localDrafts;
        }
        const combined = [...drafts];
        const existingIds = new Set(drafts.map(d => d.id));
        for (const ld of localDrafts) {
          if (!existingIds.has(ld.id)) {
            combined.push(ld);
          }
        }
        localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(combined));
        return combined;
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
    const draftIndex = drafts.findIndex(d => Number(d.id) === Number(id));
    let draftToApprove: Patient | undefined;

    if (draftIndex >= 0) {
      draftToApprove = drafts[draftIndex];
      drafts.splice(draftIndex, 1);
      localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
    }

    const approvePayload: any = draftToApprove ? { ...draftToApprove, status: 'Active' } : { status: 'Active' };

    // If ID is a local timestamp (> 1000000000000), save directly in DB as new approved patient
    if (id > 1000000000000 || (draftToApprove && (!draftToApprove.id || draftToApprove.id > 1000000000000))) {
      delete approvePayload.id;
      return this.savePatient(approvePayload);
    }

    return this.http.put<Patient>(`${this.apiUrl}/${id}/approve`, approvePayload).pipe(
      tap((res) => {
        if (res && res.id) {
          this.saveLocalPatient(res);
        } else if (draftToApprove) {
          this.saveLocalPatient(draftToApprove);
        }
      }),
      catchError((err) => {
        console.warn('Backend draft approve fallback:', err);
        if (draftToApprove) {
          const payload: any = { ...draftToApprove, status: 'Active' };
          delete payload.id;
          return this.savePatient(payload);
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