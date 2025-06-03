import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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
            <a href="#" class="forgot-password">Forgot Password?</a>
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

          <button type="button" class="google-btn">
            <span>Continue with Google</span>
          </button>

          <p class="signup-link">
            Don't have an account? <a href="#" (click)="onSignupClick($event)">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.css']
})
export class LoginSidebarComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<any>();

  loginForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      // Simulate API call
      setTimeout(() => {
        console.log('Login attempt:', this.loginForm.value);
        this.isLoading = false;

        // Emit success event
        this.loginSuccess.emit(this.loginForm.value);

        // Close sidebar after successful login
        this.onClose();

        // Reset form
        this.loginForm.reset();
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  onSignupClick(event: Event) {
    event.preventDefault();
    // Handle signup logic here
    console.log('Navigate to signup');
  }
}
