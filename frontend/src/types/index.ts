export type UserRole = "teacher" | "school" | "admin" | "staff";
export type UserStatus = "pending" | "active" | "inactive" | "completed";
export type StaffRole = "cleaner" | "secretary" | "manager" | "accountant" | "it_support" | "receptionist" | "other";
export type JobStatus = "pending" | "active" | "closed" | "removed";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type InvitationStatus = "pending" | "accepted" | "rejected";
export type NotificationType = "invitation" | "application" | "job_posted";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  activated_at: string | null;
  created_at: string;
}

export interface Teacher {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_completed: boolean;
  salary_expectation: number | null;
  cv_path: string | null;
  address: string | null;
  work_experience: string | null;
  preferred_location: string | null;
  additional_documents: string | null;
  profile_picture: string | null;
  department: string | null;
  status: "active" | "inactive";
  created_at: string;
  // extended fields returned by some endpoints
  location?: string | null;
  user_status?: string;
}

export interface School {
  id: number;
  user_id: number;
  school_name: string;
  representative_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  license_number: string | null;
  license_file_path: string | null;
  founded_year: number | null;
  school_type: string | null;
  number_of_students: number | null;
  number_of_teachers: number | null;
  accreditation_info: string | null;
  school_level: string | null;
  created_at: string;
}

export interface Job {
  id: number;
  school_id: number;
  school_name?: string;
  school_address?: string;
  title: string;
  department: string;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  location: string | null;
  status: JobStatus;
  created_at: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  teacher_id: number;
  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;
  teacher?: Teacher;
  job?: Job;
}

export interface Invitation {
  id: number;
  school_id: number;
  teacher_id: number;
  department: string;
  message: string | null;
  status: InvitationStatus;
  created_at: string;
  school?: School;
  teacher?: Teacher;
  school_name?: string;
  teacher_name?: string;
}

export interface StaffProfile {
  id: number;
  user_id: number;
  user_email?: string;
  user_status?: UserStatus;
  first_name: string;
  last_name: string;
  phone: string | null;
  staff_role: StaffRole;
  department: string | null;
  notes: string | null;
  can_manage_jobs: boolean;
  can_manage_schools: boolean;
  can_manage_teachers: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  created_at: string;
}

export interface Notification {  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  related_id: number | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  profile: Teacher | School | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
