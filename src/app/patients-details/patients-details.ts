import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { FamilyMember } from '../interfaces/family-member.interface';
import { PatientDetails } from '../interfaces/patient-details.interface';
import { RelationshipType } from '../interfaces/relationship-type.interface';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-patient-details',
  templateUrl: './patients-details.html',
  styleUrls: ['./patients-details.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PatientDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private patientService = inject(PatientService);

  patientData: PatientDetails | null = null;
  isLoading = true;
  errorMessage = '';

  activeTab: 'family' | 'files' | 'reminders' = 'family';
  sidebarCollapsed = false;
  remindersExpanded = false;
  usersExpanded = false;
  
  showAddFamilyModal = false;
  modalStep: 'search' | 'details' = 'search';
  modalErrorMessage = '';
  
  searchQuery = '';
  allPatients: any[] = [];
  searchResults: any[] = [];
  isSearching = false;
  selectedPatient: any = null;
  
  relationshipTypes: RelationshipType[] = [];
  selectedRelationshipTypeId: number | null = null;
  isSavingFamily = false;

  showEditFamilyModal = false;
  selectedFamilyMember: FamilyMember | null = null;
  editRelationshipTypeId: number | null = null;
  isUpdatingFamily = false;
  isRemovingFamily = false;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const patientId = params.get('id') || params.get('patientId');
      if (patientId) {
        this.fetchPatientDetails(patientId);
      } else {
        this.errorMessage = 'No patient ID found in URL.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.fetchRelationshipTypes();

    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => this.executeSearch(query));
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  fetchPatientDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.patientService.getPatientById(id).subscribe({
      next: (data) => {
        this.patientData = data;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = typeof err.error === 'string' 
          ? err.error 
          : err.error?.message || 'Failed to load patient details.';
        this.cdr.detectChanges();
      }
    });
  }

  fetchRelationshipTypes(): void {
    this.patientService.getRelationshipTypes().subscribe({
      next: (types) => {
        this.relationshipTypes = types || [];
        if (this.relationshipTypes.length > 0) {
          const first = this.relationshipTypes[0];
          this.selectedRelationshipTypeId = first.relationshipTypeId ?? first.id ?? null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load relationship types:', err)
    });
  }

  openAddFamilyModal(): void {
    this.showAddFamilyModal = true;
    this.modalStep = 'search';
    this.modalErrorMessage = '';
    this.searchQuery = '';
    this.searchResults = [];
    this.selectedPatient = null;

    if (this.relationshipTypes.length > 0) {
      const first = this.relationshipTypes[0];
      this.selectedRelationshipTypeId = first.relationshipTypeId ?? first.id ?? null;
    }

    this.loadInitialPatients();
    this.cdr.detectChanges();
  }

  closeAddFamilyModal(): void {
    this.showAddFamilyModal = false;
    this.modalErrorMessage = '';
    this.cdr.detectChanges();
  }

  loadInitialPatients(): void {
    this.isSearching = true;

    this.patientService.getPatients().subscribe({
      next: (data) => {
        this.allPatients = data.map((p: any) => ({
          ...p,
          fullName: p.fullName || `${p.firstName || ''} ${p.fatherName || ''} ${p.lastName || ''}`.trim()
        }));
        this.isSearching = false;
        this.filterSearchResults(this.searchQuery);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSearching = false;
        console.error('Failed to load patients for search:', err);
        this.cdr.detectChanges();
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private executeSearch(query: string): void {
    if (!query?.trim()) {
      this.searchResults = [];
      this.cdr.detectChanges();
      return;
    }

    this.isSearching = true;
    this.patientService.getPatients(query).subscribe({
      next: (data) => {
        const results = data.length > 0 ? data : this.allPatients;
        this.searchResults = this.filterListByQuery(results, query);
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.filterSearchResults(query);
        this.isSearching = false;
        this.cdr.detectChanges();
      }
    });
  }

  private filterSearchResults(query: string): void {
    if (!query?.trim()) {
      this.searchResults = [];
      return;
    }
    this.searchResults = this.filterListByQuery(this.allPatients, query);
  }

  private filterListByQuery(list: any[], query: string): any[] {
    const q = query.toLowerCase().trim();
    const existingFamilyIds = (this.patientData?.familyMembers || []).map(m => m.patientId);

    return list.filter(p => {
      if (p.patientId === this.patientData?.patientId || existingFamilyIds.includes(p.patientId)) return false;

      const fileNum = (p.fileNumber || `FILE#${p.patientId}`).toLowerCase();
      const name = (p.fullName || `${p.firstName} ${p.fatherName} ${p.lastName}`).toLowerCase();
      return fileNum.includes(q) || name.includes(q) || (p.phone1 || '').includes(q) || (p.phone2 || '').includes(q);
    });
  }

  selectPatientForFamily(patient: any): void {
    this.selectedPatient = patient;
    this.modalStep = 'details';
    this.modalErrorMessage = '';
    this.cdr.detectChanges();
  }

  saveFamilyMember(): void {
    if (!this.selectedPatient || !this.patientData?.patientId || !this.selectedRelationshipTypeId) return;

    this.isSavingFamily = true;
    this.modalErrorMessage = '';
    const payload = {
      patientId: Number(this.patientData.patientId),
      relatedPatientId: Number(this.selectedPatient.patientId),
      relationshipTypeId: Number(this.selectedRelationshipTypeId)
    };

    this.patientService.assignFamilyMember(payload).subscribe({
      next: () => this.handleSuccessfulAssignment(),
      error: (err) => {
        const errStr = typeof err.error === 'string' ? err.error : JSON.stringify(err?.error || '');
        if (errStr.includes('object cycle')) {
          this.handleSuccessfulAssignment();
        } else {
          this.isSavingFamily = false;
          this.handleModalError(err, 'Failed to assign family member.');
        }
      }
    });
  }

  private handleSuccessfulAssignment(): void {
    this.isSavingFamily = false;
    this.closeAddFamilyModal();
    if (this.patientData?.patientId) {
      this.fetchPatientDetails(String(this.patientData.patientId));
    }
  }

  openEditFamilyModal(member: FamilyMember): void {
    this.selectedFamilyMember = member;
    this.modalErrorMessage = '';
    this.editRelationshipTypeId = member.relationshipTypeId ?? null;

    if (!this.editRelationshipTypeId && this.relationshipTypes.length > 0) {
      const matched = this.relationshipTypes.find(r => 
        r.code?.toUpperCase() === member.relationshipCode?.toUpperCase() ||
        r.displayName?.toUpperCase() === member.relationshipName?.toUpperCase()
      );
      this.editRelationshipTypeId = matched ? (matched.relationshipTypeId ?? matched.id ?? null) : null;
    }

    this.showEditFamilyModal = true;
    this.cdr.detectChanges();
  }

  closeEditFamilyModal(): void {
    this.showEditFamilyModal = false;
    this.selectedFamilyMember = null;
    this.modalErrorMessage = '';
    this.cdr.detectChanges();
  }

  updateFamilyMember(): void {
    if (!this.selectedFamilyMember || !this.patientData?.patientId || !this.editRelationshipTypeId) return;

    this.isUpdatingFamily = true;
    this.modalErrorMessage = '';
    const payload = {
      patientId: Number(this.patientData.patientId),
      relatedPatientId: Number(this.selectedFamilyMember.patientId),
      relationshipTypeId: Number(this.editRelationshipTypeId)
    };

    this.patientService.assignFamilyMember(payload).subscribe({
      next: () => {
        this.isUpdatingFamily = false;
        this.closeEditFamilyModal();
        this.fetchPatientDetails(String(this.patientData!.patientId));
      },
      error: (err) => {
        this.isUpdatingFamily = false;
        this.handleModalError(err, 'Failed to update relationship.');
      }
    });
  }

  removeFamilyMember(): void {
    if (!this.selectedFamilyMember || !this.patientData?.patientId) return;
    if (!confirm(`Are you sure you want to remove ${this.selectedFamilyMember.fullName} from family members?`)) return;

    this.isRemovingFamily = true;
    this.modalErrorMessage = '';
    const targetId = this.selectedFamilyMember.patientId;

    this.patientService.removeFamilyMember(targetId).subscribe({
      next: () => this.handleSuccessfulRemoval(targetId),
      error: (err) => {
        const errStr = typeof err.error === 'string' ? err.error : JSON.stringify(err?.error || '');
        if (errStr.includes('object cycle')) {
          this.handleSuccessfulRemoval(targetId);
        } else {
          this.isRemovingFamily = false;
          this.handleModalError(err, 'Failed to remove family member.');
        }
      }
    });
  }

  private handleSuccessfulRemoval(removedPatientId: number): void {
    this.isRemovingFamily = false;
    if (this.patientData?.familyMembers) {
      this.patientData.familyMembers = this.patientData.familyMembers.filter(m => m.patientId !== removedPatientId);
    }
    this.closeEditFamilyModal();
    if (this.patientData?.patientId) {
      this.fetchPatientDetails(String(this.patientData.patientId));
    }
  }

  private handleModalError(err: any, fallbackMessage: string): void {
    let cleanMessage = fallbackMessage;
    if (err?.error) {
      try {
        const parsed = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
        cleanMessage = parsed.errorMessage || parsed.errorHeader || cleanMessage;
      } catch {
        if (typeof err.error === 'string' && !err.error.includes('object cycle')) {
          cleanMessage = err.error;
        }
      }
    }
    this.modalErrorMessage = cleanMessage;
    this.cdr.detectChanges();
  }

  getGenderDob(genderCode?: string, dob?: string | null): string {
    return `${genderCode || 'N/A'} - ${dob ? new Date(dob).toLocaleDateString() : 'N/A'}`;
  }

  getPhoneNumbers(p1?: string, p2?: string): string {
    const phones = [p1, p2].filter(Boolean);
    return phones.length > 0 ? phones.join(' / ') : 'N/A';
  }

  getBadgeClass(relationshipCode: string): string {
    switch (relationshipCode?.toUpperCase()) {
      case 'RESPONSIBLE': return 'badge-primary';
      case 'SPOUSE': return 'badge-pink';
      case 'SON': return 'badge-blue';
      case 'DAUGHTER': return 'badge-purple';
      case 'BROTHER':return 'badge-blue';
      case 'SISTER': return 'badge-purple';
      case 'FATHER':return 'badge-blue';
      case 'MOTHER':return 'badge-purple'
      case 'PARENT': return 'badge-green';
      default: return 'badge-default';
    }
  }

  formatDate(dateStr?: string | null): string {
    return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
  }

  goBack(): void { this.location.back(); }

  editPatient(): void {
    if (this.patientData?.patientId) {
      this.router.navigate(['/patients/edit', this.patientData.patientId]);
    }
  }
}