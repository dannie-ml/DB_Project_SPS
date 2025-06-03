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
    // Handle successful login here
    // For example, store user data, redirect, etc.

    // Show success message
    alert('Login successful! Welcome back.');
  }
}
