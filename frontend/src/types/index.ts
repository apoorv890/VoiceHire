// User types
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
}

// Job types
export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  status: string;
  createdAt?: string;
}

// Candidate types
export interface Candidate {
  _id: string;
  name: string;
  email: string;
  atsScore: number;
  matchExplanation?: string;
  resumeUrl?: string;
  resumeText?: string;
  interviewScheduled?: boolean;
  interviewDate?: string;
  jobId: {
    _id: string;
    title: string;
    department: string;
  };
  createdAt?: string;
}

// Auth types
export interface AuthFormData {
  fullName?: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
