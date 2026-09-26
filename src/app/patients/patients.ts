import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PatientDetails } from '../interfaces/patient-details.interface';
import { PatientService } from '../services/patient.service';

export type Patient = Pick<
    PatientDetails,
    'patientId' | 'fileNumber' | 'firstName' | 'fatherName' | 'lastName' | 'phone1' | 'phone2'
>;

@Component({
    selector: 'app-patients',
    templateUrl: './patients.html',
    styleUrls: ['./patients.css'],
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class Patients implements OnInit {
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private patientService = inject(PatientService);

    sidebarCollapsed = false;
    remindersExpanded = false;
    usersExpanded = false;

    patients: Patient[] = [];
    filteredPatients: Patient[] = [];
    searchTerm = '';

    isLoading = true;
    errorMessage = '';

    ngOnInit(): void {
        this.fetchPatients();
    }

    fetchPatients(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.patientService.getPatients().subscribe({
            next: (response) => {
                let extractedList: Patient[] = [];
                if (Array.isArray(response)) {
                    extractedList = response;
                } else if (response?.$values) {
                    extractedList = response.$values;
                } else if (response?.data) {
                    extractedList = response.data;
                } else if (response?.items) {
                    extractedList = response.items;
                }

                this.patients = extractedList;
                this.filteredPatients = [...this.patients];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = typeof err.error === 'string' 
                    ? err.error 
                    : err.error?.message || 'Failed to load patients list.';
                this.cdr.detectChanges();
            }
        });
    }

    filterPatients(): void {
        if (!this.searchTerm.trim()) {
            this.filteredPatients = [...this.patients];
            return;
        }

        const term = this.searchTerm.toLowerCase();
        this.filteredPatients = this.patients.filter(p => 
            p.firstName?.toLowerCase().includes(term) ||
            p.lastName?.toLowerCase().includes(term) ||
            p.fatherName?.toLowerCase().includes(term) ||
            p.fileNumber?.toLowerCase().includes(term) ||
            p.phone1?.includes(term)
        );
    }

    goToPatientDetails(patientId: number): void {
        this.router.navigate(['/patient-details', patientId]);
    }

    addPatient(): void {
        this.router.navigate(['/patient']);
    }
}