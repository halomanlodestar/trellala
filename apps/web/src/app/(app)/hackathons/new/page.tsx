import type { Metadata } from "next";
import { HackathonForm } from "@/components/hackathons/form/hackathon-form";
import { PageHeader } from "@/components/layout/page-header";
import { hackathonFormDefaults } from "@/lib/form";
import { loadTagSuggestions } from "@/server/queries/people";

export const metadata: Metadata = { title: "New hackathon" };

export default async function NewHackathonPage() {
  const tags = await loadTagSuggestions();
  return (
    <>
      <PageHeader title="New hackathon" />
      <HackathonForm defaultValues={hackathonFormDefaults()} tagSuggestions={tags} />
    </>
  );
}
