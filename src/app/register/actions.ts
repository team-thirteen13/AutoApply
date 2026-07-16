"use server";

import { redirect } from "next/navigation";
import { signUp } from "@/features/auth";
import { getAuthErrorMessage } from "@/features/auth/auth-error-messages";

export interface RegisterState {
  success: boolean;
  message: string;
}

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Client-side-like validation before calling Supabase
  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  if (password.length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 characters",
    };
  }

  const result = await signUp({ email, password });

  if (!result.success) {
    return { success: false, message: getAuthErrorMessage(result.error.code) };
  }

  // If email is confirmed (autoconfirm ON), redirect to dashboard
  if (result.data.emailConfirmed) {
    redirect("/dashboard");
  }

  // Otherwise, show check-your-email message
  return {
    success: true,
    message: "Registration successful! Check your email to confirm your account.",
  };
}
