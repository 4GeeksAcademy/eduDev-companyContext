"use client";

import { useEffect, useState } from "react";
import { CandidateForm } from "@/components/CandidateForm";
import { Feedback } from "@/components/Feedback";
import { getCandidate } from "@/services/api";
import type { Candidate } from "@/types/api";

export function EditCandidatePage({ id }: { id: string }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await getCandidate(id);
        if (active) setCandidate(response);
      } catch (caughtError) {
        if (active) setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar la candidatura.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  if (loading) return <Feedback type="loading">Cargando candidatura…</Feedback>;
  if (error) return <Feedback type="error">{error}</Feedback>;
  if (!candidate) return <Feedback type="error">No se encontró la candidatura.</Feedback>;
  return <CandidateForm candidate={candidate} />;
}
