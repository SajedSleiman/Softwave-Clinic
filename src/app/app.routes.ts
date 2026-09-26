// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Patients } from './patients/patients';
import { AddPatient } from './add-patients/add-patients';
import { PatientDetailsComponent } from './patients-details/patients-details'; 
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'dashboard', component: Patients, canActivate: [authGuard] },
    { path: 'patient', component: AddPatient, canActivate: [authGuard] },
    { path: 'patient-details/:id', component: PatientDetailsComponent, canActivate: [authGuard] },
    {
  path: 'patients/edit/:id',
  loadComponent: () => import('./edit-patient/edit-patient').then(m => m.EditPatient)
} 
];