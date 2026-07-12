"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/features/auth";

export async function logout(): Promise<void> {
  const result = await signOut();

  if (!result.success) {
    // Even if signOut fails, redirect to home
    // (local scope signOut rarely fails)
  }

  redirect("/");
}
