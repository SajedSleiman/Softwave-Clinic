import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-add-patient',
  templateUrl: './add-patients.html',
  styleUrls: ['./add-patients.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddPatient implements OnInit {
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private patientService = inject(PatientService);

  patientForm!: FormGroup;
  loading = false;
  error = '';

  sidebarCollapsed = false;
  remindersExpanded = false; 
  usersExpanded = false;      

  ngOnInit(): void {
    this.createForm();
  }

  createForm(): void {
    this.patientForm = this.fb.group({
      fileNumber: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      fatherName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dateOfBirth: [''],
      genderCode: ['Male'],
      nationalityCode: ['LB'],
      identityNumber: [''],
      phone1: ['', [Validators.required]],
      phone2: [''],
      email: ['', [Validators.email]],
      addressLine: [''],
      city: [''],
      countryCode: ['LB'],
      balanceUSD: [0],
      balanceLBP: [0],
      paidThisMonthUSD: [0],
      paidThisMonthLBP: [0]
    });
  }

  savePatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      this.error = 'Please fill out all required fields marked with *';
      return;
    }

    this.loading = true;
    this.error = '';

    const formValue = this.patientForm.getRawValue();
    const payload = {
      ...formValue,
      fileNumber: formValue.fileNumber?.trim() || null,
      firstName: formValue.firstName?.trim() || null,
      fatherName: formValue.fatherName?.trim() || null,
      lastName: formValue.lastName?.trim() || null,
      dateOfBirth: this.formatDate(formValue.dateOfBirth),
      identityNumber: formValue.identityNumber?.trim() || null,
      phone1: formValue.phone1?.trim() || null,
      phone2: formValue.phone2?.trim() || null,
      email: formValue.email?.trim() || null,
      addressLine: formValue.addressLine?.trim() || null,
      city: formValue.city?.trim() || null,
      isResponsible: true
    };

    this.patientService.createPatient(payload).subscribe({
      next: () => {
        this.loading = false;
        this.location.back();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.parseErrorMessage(err, 'Failed to save patient.');
      }
    });
  }

  private formatDate(dateStr: string): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null;
  }

  private parseErrorMessage(err: any, fallback: string): string {
    if (typeof err.error === 'string') return err.error;
    if (err.error?.errors) return Object.values(err.error.errors).flat().join(' ');
    return err.error?.message || err.error?.title || fallback;
  }

  discard(): void {
    this.location.back();
  }
}