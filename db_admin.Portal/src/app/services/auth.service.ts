// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  new_password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Check if user is already logged in
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout();
      }
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.detail || 'Invalid request';
          break;
        case 401:
          errorMessage = 'Invalid credentials';
          this.logout(); // Auto logout on 401
          break;
        case 403:
          errorMessage = 'Access forbidden';
          break;
        case 404:
          errorMessage = 'Service not found';
          break;
        case 422:
          errorMessage = error.error?.detail || 'Validation error';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('Auth Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };

  register(userData: RegisterRequest): Observable<User> {
    this.isLoadingSubject.next(true);

    return this.http.post<User>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError((error) => {
          this.isLoadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSubject.next(true);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response: LoginResponse) => {
          // Store tokens and user data
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('token_type', response.token_type);
          localStorage.setItem('user_data', JSON.stringify(response.user));

          // Update current user
          this.currentUserSubject.next(response.user);
          this.isLoadingSubject.next(false);
        }),
        catchError((error) => {
          this.isLoadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  logout(): void {
    // Clear storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user_data');

    // Update subjects
    this.currentUserSubject.next(null);

    // Redirect to home
    this.router.navigate(['/']);
  }

  forgotPassword(email: string): Observable<any> {
    this.isLoadingSubject.next(true);

    return this.http.post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError((error) => {
          this.isLoadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  resetPassword(resetData: PasswordReset): Observable<any> {
    this.isLoadingSubject.next(true);

    return this.http.post(`${this.apiUrl}/reset-password`, resetData)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError((error) => {
          this.isLoadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((user: User) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user_data', JSON.stringify(user));
      }),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const token = localStorage.getItem('access_token');

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap((response: LoginResponse) => {
        localStorage.setItem('access_token', response.access_token);
        this.currentUserSubject.next(response.user);
      }),
      catchError(this.handleError)
    );
  }

  // Utility methods
  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token') && !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
