// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginSidebarComponent } from './pages/login/login.component';
import { AuthGuard, GuestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    canActivate: [GuestGuard] // Only allow if not logged in
  },
  {
    path: 'login',
    component: LoginSidebarComponent,
    canActivate: [GuestGuard] // Only allow if not logged in
  },
  // Add dashboard route for logged-in users
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard] // Only allow if logged in
  },
  // Add reset password route
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
