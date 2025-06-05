// src/app/pages/reset-password/reset-password.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="reset-password-container">
      <div class="reset-password-card">
        <div class="card-header">
          <img src="SPS_logo.png" alt="Logo" class="logo">
          <h1>Reset Password</h1>
          <p>Enter your new password below</p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">
          <!-- Error message display -->
          <div class="error-message general-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <!-- Success message display -->
          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <!-- Loading state -->
          <div class="loading-message" *ngIf="isValidating">
            <span>Validating reset token...</span>
          </div>

          <div class="form-group" *ngIf="isValidToken">
            <label for="password">New Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Enter your new password"
              [class.error]="resetForm.get('password')?.invalid && resetForm.get('password')?.touched">
            <div class="error-message"
                 *ngIf="resetForm.get('password')?.invalid && resetForm.get('password')?.touched">
              <span *ngIf="resetForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="resetForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group" *ngIf="isValidToken">
            <label for="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="Confirm your new password"
              [class.error]="resetForm.get('confirmPassword')?.invalid && resetForm.get('confirmPassword')?.touched">
            <div class="error-message"
                 *ngIf="resetForm.get('confirmPassword')?.invalid && resetForm.get('confirmPassword')?.touched">
              <span *ngIf="resetForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</span>
              <span *ngIf="resetForm.get('confirmPassword')?.errors?.['passwordMismatch']">Passwords do not match</span>
            </div>
          </div>

          <button
            type="submit"
            class="reset-btn"
            *ngIf="isValidToken"
            [disabled]="resetForm.invalid || isLoading"
            [class.loading]="isLoading">
            <span *ngIf="!isLoading">Reset Password</span>
            <span *ngIf="isLoading">Resetting...</span>
          </button>

          <div class="back-to-login" *ngIf="!isValidating">
            <a href="#" (click)="goToHome($event)">← Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
      min-height: 100vh;
      background: #fbf6f1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .reset-password-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      width: 100%;
      max-width: 450px;
    }

    .card-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      height: 60px;
      margin-bottom: 1rem;
    }

    .card-header h1 {
      font-size: 2rem;
      color: #333;
      margin: 0 0 0.5rem 0;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
    }

    .card-header p {
      color: #666;
      margin: 0;
      font-size: 1rem;
    }

    .reset-form {
      display: flex;
      flex-direction: column;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
      font-size: 0.9rem;
    }

    .form-group input {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
      font-family: 'DM Sans', sans-serif;
    }

    .form-group input:focus {
      outline: none;
      border-color: #393a39;
      box-shadow: 0 0 0 3px rgba(57, 58, 57, 0.1);
    }

    .form-group input.error {
      border-color: #e74c3c;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .general-error {
      background-color: #fdf2f2;
      border: 1px solid #e74c3c;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .success-message {
      background-color: #f0f9f4;
      border: 1px solid #22c55e;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #166534;
    }

    .loading-message {
      text-align: center;
      color: #666;
      font-size: 1rem;
      padding: 2rem 0;
    }

    .reset-btn {
      width: 100%;
      padding: 1rem;
      background-color: #393a39;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 1.5rem;
      font-family: 'DM Sans', sans-serif;
    }

    .reset-btn:hover:not(:disabled) {
      background-color: #2c2d2c;
      transform: translateY(-1px);
    }

    .reset-btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
      transform: none;
    }

    .reset-btn.loading {
      position: relative;
    }

    .back-to-login {
      text-align: center;
    }

    .back-to-login a {
      color: #393a39;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s ease;
    }

    .back-to-login a:hover {
      color: #666;
      text-decoration: underline;
    }

    /* Loading spinner animation */
    .reset-btn.loading::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      margin: auto;
      border: 2px solid transparent;
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @media (max-width: 480px) {
      .reset-password-container {
        padding: 1rem;
      }

      .reset-password-card {
        padding: 2rem;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm: FormGroup;
  isLoading = false;
  isValidating = true;
  isValidToken = false;
  errorMessage = '';
  successMessage = '';
  resetToken = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'];
      if (this.resetToken) {
        this.validateResetToken();
      } else {
        this.isValidating = false;
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      }
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

  private validateResetToken(): void {
    // Call backend to validate token
    fetch(`http://localhost:8000/api/auth/verify-token/${this.resetToken}`)
      .then(response => {
        this.isValidating = false;
        if (response.ok) {
          this.isValidToken = true;
        } else {
          this.errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
        }
      })
      .catch(() => {
        this.isValidating = false;
        this.errorMessage = 'Unable to validate reset token. Please try again.';
      });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      const errors = confirmPassword?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      this.clearMessages();

      const resetData = {
        token: this.resetToken,
        new_password: this.resetForm.value.password
      };

      this.authService.resetPassword(resetData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.successMessage = 'Password reset successful! Redirecting to login...';
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 2000);
          },
          error: (error) => {
            this.errorMessage = error.message;
          }
        });
    } else {
      this.markFormGroupTouched(this.resetForm);
    }
  }

  goToHome(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/']);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}
