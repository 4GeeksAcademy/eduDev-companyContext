export type CandidateStatus =
  | "received"
  | "in_progress"
  | "selected"
  | "discarded";

export type CandidateStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export interface RecordCreate {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  experience_years: number;
  linkedin_url?: string;
  cv_url?: string;
}

export interface RecordUpdate
  extends Omit<RecordCreate, "linkedin_url" | "cv_url"> {
  linkedin_url: string | null;
  cv_url: string | null;
}

export interface CandidatesResponse {
  total: number;
  page: number;
  limit: number;
  data: Candidate[];
}

export interface Note {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export interface NotesResponse {
  data: Note[];
  meta: {
    total: number;
  };
}

export interface CandidateFilters {
  status?: CandidateStatus;
  stage?: CandidateStage;
  search?: string;
}

export interface CandidatePatch {
  status?: CandidateStatus;
  stage?: CandidateStage;
}
