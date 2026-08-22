import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private apiUrl = 'http://localhost:8082/api/patients';

  constructor(private http: HttpClient) {}

  // CREATE
  savePatient(patientData: any) {
    return this.http.post(
      this.apiUrl,
      patientData
    );
  }

  // GET ALL
  getPatients() {
    return this.http.get<any[]>(
      this.apiUrl
    );
  }

  // GET BY ID
  getPatientById(id: number) {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );
  }

  // UPDATE
  updatePatient(id: number, patientData: any) {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      patientData
    );
  }

  // DELETE
deletePatient(id: number) {

  return this.http.delete(
    `http://localhost:8082/api/patients/${id}`
  );

}
}