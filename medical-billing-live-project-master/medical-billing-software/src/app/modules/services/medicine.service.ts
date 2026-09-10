import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Medicine {
  id?: number;
  name: string;
  genericName?: string;
  category?: string;
  batchNo?: string;
  expiryDate?: string;
  unitPrice: number;
  mrp?: number;
  gstRate?: number;
  rackId?: number | string;
  rackName?: string;
  stockQty?: number;
  manufacturer?: string;
  companyId?: number | string;
  company?: {
    id: number;
    name?: string;
  };
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  private apiUrl = 'http://localhost:8082/api/medicines';

  constructor(private http: HttpClient) {}

  getAllMedicines(companyId?: number | string): Observable<Medicine[]> {
    const url = companyId ? `${this.apiUrl}?companyId=${companyId}` : this.apiUrl;
    return this.http.get<Medicine[]>(url);
  }

  getMedicineById(id: number): Observable<Medicine> {
    return this.http.get<Medicine>(`${this.apiUrl}/${id}`);
  }

  saveMedicine(medicine: Medicine, companyId?: number | string): Observable<Medicine> {
    const url = companyId ? `${this.apiUrl}?companyId=${companyId}` : this.apiUrl;
    return this.http.post<Medicine>(url, medicine);
  }

  addMedicine(medicine: Medicine, companyId?: number | string): Observable<Medicine> {
    return this.saveMedicine(medicine, companyId);
  }

  updateMedicine(id: number, medicine: Medicine): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.apiUrl}/${id}`, medicine);
  }

  deleteMedicine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


