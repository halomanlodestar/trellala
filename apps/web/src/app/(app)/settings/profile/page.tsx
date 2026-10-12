import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { loadProfile, loadTagSuggestions } from "@/server/queries/people";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const [profile, suggestions] = await Promise.all([loadProfile(), loadTagSuggestions()]);
  return (
    <>
      <PageHeader title="Profile" />
      <ProfileForm profile={profile} suggestions={suggestions} />
    </>
  );
}
