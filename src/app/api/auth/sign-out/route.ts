import { signOut } from "@/features/auth";

import { authJsonResponse } from "../_shared/http";

export async function POST() {
  return authJsonResponse(await signOut());
}
