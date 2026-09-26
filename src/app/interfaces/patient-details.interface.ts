import { FamilyMember } from './family-member.interface';

export interface PatientDetails {
  patientId: number;
  fileNumber: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string | null;
  genderCode: string;
  nationalityCode: string;
  identityNumber: string;
  phone1: string;
  phone2: string;
  email: string;
  addressLine: string;
  city: string;
  countryCode: string;
  isActive: boolean;
  isResponsible: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  familyMembers: FamilyMember[];
}