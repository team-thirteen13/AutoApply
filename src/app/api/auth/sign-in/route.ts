import { signIn } from "@/features/auth";

import {
  authJsonResponse,
  hasInvalidJsonBody,
  jsonParseErrorResponse,
  readJsonBody,
} from "../_shared/http";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (hasInvalidJsonBody(body)) {
    return jsonParseErrorResponse();
  }

  return authJsonResponse(await signIn(body));
}
