import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private apiUrl = 'http://localhost:8082/api/patients';

  constructor(private http: HttpClient) {}

  savePatient(patientData: any) {
    return this.http.post(this.apiUrl, patientData);
  }

  getPatients() {
    return this.http.get<any>(this.apiUrl);
  }

  getPatientById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updatePatient(id: number, patientData: any) {
    return this.http.put(`${this.apiUrl}/${id}`, patientData);
  }

  deletePatient(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}