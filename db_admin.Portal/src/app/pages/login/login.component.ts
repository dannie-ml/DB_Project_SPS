import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login-sidebar',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="sidebar-backdrop"
         [class.open]="isOpen"
         (click)="onBackdropClick($event)">
      <div class="login-sidebar" [class.open]="isOpen">
        <div class="sidebar-header">
          <h2>Ingresar</h2>
          <button class="close-btn" (click)="onClose()" type="button">
            <span>&times;</span>
          </button>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <!-- Error message display -->
          <div class="error-message general-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <!-- Success message display -->
          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="Enter your email"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
            <div class="error-message"
                 *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Enter your password"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
            <div class="error-message"
                 *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-container">
              <input type="checkbox" formControlName="rememberMe">
              <span class="checkmark"></span>
              Remember me
            </label>
            <a href="#" class="forgot-password" (click)="onForgotPassword($event)">Forgot Password?</a>
          </div>

          <button
            type="submit"
            class="login-btn"
            [disabled]="loginForm.invalid || isLoading"
            [class.loading]="isLoading">
            <span *ngIf="!isLoading">Sign In</span>
            <span *ngIf="isLoading">Signing In...</span>
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <button type="button" class="google-btn" (click)="onGoogleLogin()">
            <span>Continue with Google</span>
          </button>

          <p class="signup-link">
            Don't have an account? <a href="#" (click)="onSignupClick($event)">Sign up</a>
          </p>
        </form>

        <!-- Forgot Password Form -->
        <form *ngIf="showForgotPassword" [formGroup]="forgotPasswordForm"
              (ngSubmit)="onForgotPasswordSubmit()" class="login-form">
          <div class="form-header">
            <h3>Reset Password</h3>
            <button type="button" class="back-btn" (click)="showForgotPassword = false">
              ← Back to Login
            </button>
          </div>

          <div class="form-group">
            <label for="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              formControlName="email"
              placeholder="Enter your email"
              [class.error]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched">
            <div class="error-message"
                 *ngIf="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched">
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <button
            type="submit"
            class="login-btn"
            [disabled]="forgotPasswordForm.invalid || isLoading">
            <span *ngIf="!isLoading">Send Reset Link</span>
            <span *ngIf="isLoading">Sending...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.css']
})
export class LoginSidebarComponent implements OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<any>();

  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showForgotPassword = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Subscribe to loading state
    this.authService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose() {
    this.resetForms();
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.clearMessages();

      const credentials: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = 'Login successful! Welcome back.';
            this.loginSuccess.emit(response);

            // Close sidebar after a short delay
            setTimeout(() => {
              this.onClose();
            }, 1000);
          },
          error: (error) => {
            this.errorMessage = error.message;
          }
        });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    this.showForgotPassword = true;
    this.clearMessages();
  }

  onForgotPasswordSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.clearMessages();

      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.successMessage = 'Password reset link sent to your email!';
            setTimeout(() => {
              this.showForgotPassword = false;
              this.forgotPasswordForm.reset();
            }, 2000);
          },
          error: (error) => {
            this.errorMessage = error.message;
          }
        });
    } else {
      this.markFormGroupTouched(this.forgotPasswordForm);
    }
  }

  onGoogleLogin() {
    // Implement Google OAuth login here
    console.log('Google login not implemented yet');
    this.errorMessage = 'Google login is not implemented yet';
  }

  onSignupClick(event: Event) {
    event.preventDefault();
    // Navigate to signup or show signup form
    console.log('Navigate to signup');
    this.errorMessage = 'Signup functionality not implemented yet';
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resetForms() {
    this.loginForm.reset();
    this.forgotPasswordForm.reset();
    this.showForgotPassword = false;
    this.clearMessages();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}
