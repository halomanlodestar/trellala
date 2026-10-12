import { HackathonForm } from "@/components/hackathons/form/hackathon-form";
import { PageHeader } from "@/components/layout/page-header";
import { hackathonFormDefaults } from "@/lib/form";
import { loadHackathon } from "@/server/queries/hackathons";
import { loadTagSuggestions } from "@/server/queries/people";

export default async function EditHackathonPage({ params }: PageProps<"/hackathons/[id]/edit">) {
  const { id } = await params;
  const [hackathon, tags] = await Promise.all([loadHackathon(id), loadTagSuggestions()]);
  return (
    <>
      <PageHeader title={`Edit · ${hackathon.name}`} />
      <HackathonForm hackathonId={id} defaultValues={hackathonFormDefaults(hackathon)} tagSuggestions={tags} />
    </>
  );
}
