"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/features/auth";
import { deleteResume } from "@/features/resume";

export async function logout(): Promise<void> {
  const result = await signOut();

  if (!result.success) {
    // Even if signOut fails, redirect to home
    // (local scope signOut rarely fails)
  }

  redirect("/");
}

export async function deleteResumeAction(id: string) {
  const result = await deleteResume(id);
  if (result.success) {
    redirect("/dashboard");
  }
  return result;
}
