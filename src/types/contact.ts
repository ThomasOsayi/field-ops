export interface ContactPerson {
    name: string;
    role: string;
    phone: string;
    email: string;
    isPrimary: boolean;
  }
  
  export interface CompanyRecord {
    id: string;
    name: string;
    address: string;
    city: string;
    contacts: ContactPerson[];
    notes: string;
    jobCount: number;
    lastJobDate: string;
    createdAt: string;
  }
  
  export type NewCompanyRecord = Omit<CompanyRecord, 'id' | 'createdAt'>;