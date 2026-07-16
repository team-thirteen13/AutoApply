"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

const initialState: LoginState = { success: false, message: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Sign In
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back to ApplyAI.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Your password"
            />
          </div>

          {state.message && (
            <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {state.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-300 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              or
            </span>
          </div>
        </div>

        <GoogleOAuthButton />

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
