export type Role = "HR" | "EMPLOYEE";

export type SkillCategory = "LANGUAGE" | "FRAMEWORK" | "PLATFORM" | "TOOL" | "DOMAIN";
export type Proficiency = "NOVICE" | "INTERMEDIATE" | "EXPERT";
export type ProfileStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SkillData {
  name: string;
  category: SkillCategory;
  proficiency: Proficiency;
  yearsExp: number;
  inferred?: boolean;
}

export interface ProjectData {
  name: string;
  description?: string;
  role?: string;
  techStack: string[];
  startDate?: string;
  endDate?: string;
}

export interface CertificationData {
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface ExtractedProfile {
  name: string;
  email?: string;
  location?: string;
  designation?: string;
  bio?: string;
  linkedinUrl?: string;
  skills: SkillData[];
  projects: ProjectData[];
  certifications: CertificationData[];
  inferredSkills: SkillData[];
}

export interface SearchResult {
  employee: EmployeeWithDetails;
  matchScore: number;
  reasoning: string;
}

export interface PendingSearchResult {
  profileId: string;
  employeeId: string;
  employeeName: string;
  designation?: string | null;
  location?: string | null;
  extractedData: ExtractedProfile;
  matchScore: number;
  reasoning: string;
}

export interface EmployeeWithDetails {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  location?: string | null;
  designation?: string | null;
  currentProject?: string | null;
  bio?: string | null;
  skills: Array<{
    skill: { name: string; category: string };
    proficiency: string;
    yearsExp: number;
    inferred: boolean;
  }>;
  projects: Array<{
    name: string;
    description?: string | null;
    role?: string | null;
    techStack: string;
  }>;
  certifications: Array<{ name: string; issuer?: string | null }>;
}
