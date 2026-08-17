"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Feedback } from "@/components/Feedback";
import {
  isCandidateStage,
  isCandidateStatus,
  STAGE_LABELS,
  STAGE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/lib/labels";
import { getCandidates } from "@/services/api";
import type { Candidate } from "@/types/api";

export function CandidateList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const stageParam = searchParams.get("stage");
  const searchParam = searchParams.get("search") ?? "";
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCandidates() {
      setLoading(true);
      setError("");
      setCandidates([]);
      try {
        const response = await getCandidates(
          {
            status: isCandidateStatus(statusParam) ? statusParam : undefined,
            stage: isCandidateStage(stageParam) ? stageParam : undefined,
            search: searchParam.trim() || undefined,
          },
          controller.signal,
        );
        setCandidates(response.data);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        setCandidates([]);
        setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las candidaturas.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCandidates();
    return () => controller.abort();
  }, [searchParam, stageParam, statusParam]);

  function updateQuery(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateQuery("search", String(data.get("search") ?? "").trim());
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Campaña Zaragoza</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Asistente de Dirección</h1>
          <p className="mt-2 text-slate-600">Consulta y gestiona todas las candidaturas del proceso.</p>
        </div>
        <Link href="/candidates/new" className="w-fit rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
          Añadir candidatura
        </Link>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Estado
          <select
            className="field mt-1"
            value={isCandidateStatus(statusParam) ? statusParam : ""}
            onChange={(event) => updateQuery("status", event.target.value)}
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Etapa
          <select
            className="field mt-1"
            value={isCandidateStage(stageParam) ? stageParam : ""}
            onChange={(event) => updateQuery("stage", event.target.value)}
          >
            <option value="">Todas las etapas</option>
            {STAGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <label className="flex-1 text-sm font-medium text-slate-700">
            Nombre o correo electrónico
            <input
              key={searchParam}
              className="field mt-1"
              name="search"
              defaultValue={searchParam}
              placeholder="Buscar candidatura"
            />
          </label>
          <button className="button-secondary" type="submit">Buscar</button>
        </form>
      </div>

      {loading && <Feedback type="loading">Cargando candidaturas…</Feedback>}
      {error && <Feedback type="error">{error}</Feedback>}
      {!loading && !error && <Feedback type="success">{candidates.length} candidatura(s) cargada(s).</Feedback>}

      {!loading && !error && candidates.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No hay candidaturas que coincidan con los filtros.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {candidates.map((candidate) => (
          <article key={candidate.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{candidate.full_name}</h2>
                <p className="mt-1 text-sm text-slate-600">{candidate.position}</p>
              </div>
              <Link href={`/candidates/${candidate.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Ver detalle
              </Link>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Estado</dt><dd className="font-medium text-slate-900">{STATUS_LABELS[candidate.status]}</dd></div>
              <div><dt className="text-slate-500">Etapa</dt><dd className="font-medium text-slate-900">{STAGE_LABELS[candidate.stage]}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
