import { NextResponse } from "next/server";

import type { AuthErrorCode, AuthOperationResult } from "@/types/auth";

const ERROR_STATUS: Record<AuthErrorCode, number> = {
  invalid_email: 400,
  invalid_password: 400,
  invalid_redirect: 400,
  weak_password: 400,
  invalid_credentials: 401,
  user_not_found: 401,
  email_not_confirmed: 403,
  session_expired: 401,
  session_missing: 401,
  email_exists: 409,
  rate_limited: 429,
  oauth_failed: 401,
  unexpected: 500,
};

export async function readJsonBody(request: Request): Promise<unknown> {
  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {
      __invalidJson: true,
    };
  }
}

export function jsonParseErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "unexpected",
        message: "Request body must be valid JSON",
      },
    },
    { status: 400 },
  );
}

export function hasInvalidJsonBody(input: unknown): boolean {
  return (
    typeof input === "object" &&
    input !== null &&
    "__invalidJson" in input
  );
}

export function authJsonResponse<T>(
  result: AuthOperationResult<T>,
  successStatus = 200,
) {
  if (result.success) {
    return NextResponse.json(result, { status: successStatus });
  }

  return NextResponse.json(result, {
    status: ERROR_STATUS[result.error.code],
  });
}
