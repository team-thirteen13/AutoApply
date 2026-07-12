"use client";

import { useActionState } from "react";
import { logout } from "./actions";

export function LogoutButton() {
  const [, formAction, isPending] = useActionState(logout, null);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {isPending ? "Signing out..." : "Logout"}
      </button>
    </form>
  );
}
