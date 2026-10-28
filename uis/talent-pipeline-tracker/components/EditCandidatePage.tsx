"use client";

import { useEffect, useState } from "react";
import { CandidateForm } from "@/components/CandidateForm";
import { Feedback } from "@/components/Feedback";
import { candidateErrorMessage, getCandidate, isCandidateAbort } from "@/services/api";
import type { Candidate } from "@/types/api";

export function EditCandidatePage({ id }: { id: string }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await getCandidate(id, controller.signal);
        if (!controller.signal.aborted) setCandidate(response);
      } catch (caughtError) {
        if (!controller.signal.aborted && !isCandidateAbort(caughtError)) setError(candidateErrorMessage(caughtError, "No se pudo cargar la candidatura."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, retry]);

  if (loading) return <Feedback type="loading">Cargando candidatura…</Feedback>;
  if (error) return <Feedback type="error">{error} <button type="button" className="button-secondary" onClick={() => setRetry(value => value + 1)}>Reintentar</button></Feedback>;
  if (!candidate) return <Feedback type="error">No se encontró la candidatura.</Feedback>;
  return <CandidateForm key={candidate.id} candidate={candidate} />;
}
