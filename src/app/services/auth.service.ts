import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';

export interface LoginResponse {
  jwtToken?: string;
  token?: string;
  Token?: string;
  userId?: number;
  username?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '';

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  login(username: string, password: string): Observable<LoginResponse> {
    const loginRequest = { username, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<LoginResponse>(`${this.apiUrl}/api/Auth/Login`, loginRequest, { headers }).pipe(
      tap((response) => {
        console.log('[AuthService] raw login response:', response);
    
        const token = response?.jwtToken || response?.token || response?.Token;
        
        if (token) {
          localStorage.setItem('authToken', token);
          this.isLoggedInSubject.next(true);
        }
      }),
      catchError((err) => {
        console.error('[AuthService] HTTP error caught:', err);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.isLoggedInSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  hasToken(): boolean {
    return !!this.getToken();
  }
}