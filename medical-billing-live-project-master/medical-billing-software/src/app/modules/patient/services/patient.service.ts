import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private apiUrl = 'http://localhost:8082/api/patients';

  constructor(
    private http: HttpClient
  ) {}

  // GET
  getPatients(): Observable<any[]> {

    return this.http.get<any[]>(
      this.apiUrl
    );
  }

  // POST
  savePatient(patientData: any): Observable<any> {

    return this.http.post(
      this.apiUrl,
      patientData
    );
  }

  // GET BY ID
  getPatientById(id: number): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/${id}`
    );
  }

  // UPDATE
  updatePatient(
    id: number,
    patientData: any
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}`,
      patientData
    );
  }

  // DELETE
  deletePatient(id: number): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`,
      {
        responseType: 'text'
      }
    );
  }
}