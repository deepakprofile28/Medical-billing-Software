import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiConsultation {
  id?: number;
  queryPrompt: string;
  medicineName?: string;
  genericComposition?: string;
  category?: string;
  dosageInstructions?: string;
  sideEffects?: string;
  genericSubstitutes?: string;
  aiResponse?: string;
  status?: string;
  company?: {
    id: number;
    name?: string;
  };
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiConsultationService {

  private apiUrl = 'http://localhost:8082/api/ai';

  constructor(private http: HttpClient) {}

  analyzeDrug(prompt: string, companyId?: number | string): Observable<AiConsultation> {
    return this.http.post<AiConsultation>(`${this.apiUrl}/analyze`, {
      prompt,
      companyId: companyId ? Number(companyId) : undefined
    });
  }

  getHistory(companyId?: number | string): Observable<AiConsultation[]> {
    const url = companyId ? `${this.apiUrl}/history?companyId=${companyId}` : `${this.apiUrl}/history`;
    return this.http.get<AiConsultation[]>(url);
  }

  getById(id: number): Observable<AiConsultation> {
    return this.http.get<AiConsultation>(`${this.apiUrl}/${id}`);
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

