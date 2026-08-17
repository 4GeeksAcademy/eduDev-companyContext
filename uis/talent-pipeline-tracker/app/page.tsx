import { Suspense } from "react";
import { CandidateList } from "@/components/CandidateList";
import { Feedback } from "@/components/Feedback";

export default function Home() {
  return (
    <Suspense fallback={<Feedback type="loading">Preparando filtros…</Feedback>}>
      <CandidateList />
    </Suspense>
  );
}
