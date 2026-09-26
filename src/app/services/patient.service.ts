import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientDetails } from '../interfaces/patient-details.interface';
import { RelationshipType } from '../interfaces/relationship-type.interface';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Patients';
  private relationshipUrl = '/api/RelationShip';

  // --- Patient CRUD ---

  getPatients(searchQuery?: string): Observable<any> {
    const url = searchQuery 
      ? `${this.apiUrl}?search=${encodeURIComponent(searchQuery)}` 
      : this.apiUrl;
    return this.http.get<any>(url);
  }

  getPatientById(id: string | number): Observable<PatientDetails> {
    return this.http.get<PatientDetails>(`${this.apiUrl}/${id}`);
  }

  createPatient(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload, { responseType: 'text' as 'json' });
  }

  updatePatient(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload, { responseType: 'text' as 'json' });
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' as 'json' });
  }


  getRelationshipTypes(): Observable<RelationshipType[]> {
    return this.http.get<RelationshipType[]>(`${this.relationshipUrl}/GetRelationShipType`);
  }

  assignFamilyMember(payload: { patientId: number; relatedPatientId: number; relationshipTypeId: number }): Observable<any> {
    return this.http.post(`${this.relationshipUrl}/AssignFamilyMember`, payload, { responseType: 'text' as 'json' });
  }

  removeFamilyMember(targetId: number): Observable<any> {
    return this.http.post(`${this.relationshipUrl}/RemoveFamilyMember/${targetId}`, {}, { responseType: 'text' as 'json' });
  }
}