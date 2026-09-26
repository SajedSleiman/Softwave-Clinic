export interface FamilyMember {
  patientId: number;
  fileNumber: string;
  fullName: string;
  dateOfBirth: string | null;
  genderCode: string;
  phone1: string;
  phone2: string;
  isResponsible: boolean;
  relationshipTypeId: number | null;
  relationshipCode: string;
  relationshipName: string;
}