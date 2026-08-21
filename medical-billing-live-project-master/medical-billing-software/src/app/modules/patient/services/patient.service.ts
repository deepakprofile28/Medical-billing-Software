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

  savePatient(patientData: any): Observable<any> {

    return this.http.post(
      this.apiUrl,
      patientData
    );

  }

}