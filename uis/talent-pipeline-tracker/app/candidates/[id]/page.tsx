import { CandidateDetail } from "@/components/CandidateDetail";

export default async function CandidatePage({ params }: PageProps<"/candidates/[id]">) {
  const { id } = await params;
  return <CandidateDetail id={id} />;
}
