import "server-only";
import * as core from "@trellala/core";
import { notFound } from "next/navigation";
import { requireUser } from "../auth";

export async function loadPeople() {
  await requireUser();
  return core.listPeople();
}

export async function loadPeopleWithTeams() {
  await requireUser();
  return core.listPeopleWithTeams();
}

export async function loadTagSuggestions() {
  await requireUser();
  return core.listTagSuggestions();
}

export async function loadProfile() {
  const user = await requireUser();
  const profile = await core.getProfile(user.id);
  if (!profile) notFound();
  return profile;
}

export async function loadApiKeys() {
  await requireUser();
  return core.listApiKeys();
}
