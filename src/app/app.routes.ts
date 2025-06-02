import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginSidebarComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', component: LandingComponent }, // Página principal
  { path: 'login', component: LoginSidebarComponent },
  { path: '**', redirectTo: '' } // Wildcard route
];
