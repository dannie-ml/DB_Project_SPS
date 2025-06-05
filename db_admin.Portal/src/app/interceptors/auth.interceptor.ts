import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth header if user is logged in and request is to our API
    if (this.authService.getToken() && this.isApiUrl(request)) {
      request = this.addTokenHeader(request, this.authService.getToken()!);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.isApiUrl(request)) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private isApiUrl(request: HttpRequest<any>): boolean {
    return request.url.startsWith('http://localhost:8000/api/');
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Since your backend doesn't have refresh token endpoint,
      // we'll logout the user on 401 errors
      this.authService.logout();
      this.router.navigate(['/']);
      return throwError(() => new Error('Session expired. Please login again.'));

      // If you implement refresh token in the future, use this pattern:
      /*
      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.access_token);
          return next.handle(this.addTokenHeader(request, response.access_token));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/']);
          return throwError(() => error);
        })
      );
      */
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addTokenHeader(request, jwt));
        })
      );
    }
  }
}
