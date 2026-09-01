import type { CandidateStage, CandidateStatus } from "@/types/api";

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  selected: "Seleccionada",
  discarded: "Descartada",
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: "Pendiente de revisión",
  review: "En revisión",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
  offer_presented: "Oferta presentada",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as Array<
  [CandidateStatus, string]
>;

export const STAGE_OPTIONS = Object.entries(STAGE_LABELS) as Array<
  [CandidateStage, string]
>;

export function isCandidateStatus(value: string | null): value is CandidateStatus {
  return value !== null && value in STATUS_LABELS;
}

export function isCandidateStage(value: string | null): value is CandidateStage {
  return value !== null && value in STAGE_LABELS;
}
