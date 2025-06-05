// src/app/pages/landing/landing.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginSidebarComponent } from '../../pages/login/login.component';

@Component({
  selector: 'app-landing',
  imports: [LoginSidebarComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  isLoginSidebarOpen = false;

  constructor(private router: Router) {}

  openLoginSidebar() {
    this.isLoginSidebarOpen = true;
    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden';
  }

  closeLoginSidebar() {
    this.isLoginSidebarOpen = false;
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  onLoginSuccess(loginData: any) {
    console.log('Login successful:', loginData);

    // Close the sidebar
    this.closeLoginSidebar();

    // Navigate to dashboard after successful login
    this.router.navigate(['/dashboard']);

    // Optional: Show success message
    // You could use a toast service here instead of alert
    setTimeout(() => {
      alert(`Welcome back, ${loginData.user.full_name}!`);
    }, 500);
  }
}
