import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-edit-patient',
  templateUrl: './edit-patient.html',
  styleUrls: ['./edit-patient.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class EditPatient implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private patientService = inject(PatientService);

  patientForm!: FormGroup;
  patientId!: number;
  loading = false;
  deleting = false;
  error = '';

  sidebarCollapsed = false;
  remindersExpanded = false;
  usersExpanded = false;

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && !isNaN(+id)) {
        this.patientId = +id;
        this.loadPatientData(this.patientId);
      } else {
        this.error = 'Invalid patient ID.';
      }
    });
  }

  initForm(): void {
    this.patientForm = this.fb.group({
      fileNumber: [{ value: '', disabled: true }],
      firstName: ['', [Validators.required]],
      fatherName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dateOfBirth: [''],
      genderCode: ['Male'],
      nationalityCode: ['Lebanese'],
      identityNumber: [''],
      phone1: ['', [Validators.required]],
      phone2: [''],
      email: ['', [Validators.email]],
      addressLine: [''],
      city: [''],
      countryCode: ['Lebanon'],
      balanceUSD: [{ value: 0, disabled: true }],
      balanceLBP: [{ value: 0, disabled: true }],
      paidThisMonthUSD: [{ value: 0, disabled: true }],
      paidThisMonthLBP: [{ value: 0, disabled: true }]
    });
  }

  loadPatientData(id: number): void {
    this.loading = true;
    this.error = '';

    this.patientService.getPatientById(id).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.patientForm.patchValue({
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          balanceUSD: data.financialSummary?.balanceUsd ?? 0,
          balanceLBP: data.financialSummary?.balanceLbp ?? 0,
          paidThisMonthUSD: data.financialSummary?.paidThisMonthUsd ?? 0,
          paidThisMonthLBP: data.financialSummary?.paidThisMonthLbp ?? 0
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load patient records for editing.';
      }
    });
  }

  savePatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      this.error = 'Please complete all required fields marked with *';
      return;
    }

    this.loading = true;
    const formValue = this.patientForm.getRawValue();
    const payload = {
      ...formValue,
      firstName: formValue.firstName?.trim() || null,
      fatherName: formValue.fatherName?.trim() || null,
      lastName: formValue.lastName?.trim() || null,
      dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth).toISOString().split('T')[0] : null,
      isResponsible: true
    };

    this.patientService.updatePatient(this.patientId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.location.back();
      },
      error: (err) => {
        this.loading = false;
        this.error = typeof err.error === 'string' ? err.error : 'Failed to update patient file.';
      }
    });
  }

  deletePatient(): void {
    if (!this.patientId || !confirm('Are you sure you want to permanently delete this patient record?')) return;

    this.deleting = true;
    this.patientService.deletePatient(this.patientId).subscribe({
      next: () => {
        this.deleting = false;
        this.location.back();
      },
      error: () => {
        this.deleting = false;
        this.error = 'Failed to delete patient. Ensure no dependent active records block deletion.';
      }
    });
  }

  discard(): void {
    this.location.back();
  }
}