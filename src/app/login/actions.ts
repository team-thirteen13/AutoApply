"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/features/auth";
import { getAuthErrorMessage } from "@/features/auth/auth-error-messages";

export interface LoginState {
  success: boolean;
  message: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  const result = await signIn({ email, password });

  if (!result.success) {
    return { success: false, message: getAuthErrorMessage(result.error.code) };
  }

  redirect("/dashboard");
}
