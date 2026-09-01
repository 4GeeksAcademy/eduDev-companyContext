import { EditCandidatePage } from "@/components/EditCandidatePage";

export default async function CandidateEditRoute({ params }: PageProps<"/candidates/[id]/edit">) {
  const { id } = await params;
  return <EditCandidatePage id={id} />;
}
