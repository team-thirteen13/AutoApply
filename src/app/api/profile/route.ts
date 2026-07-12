// ─────────────────────────────────────────────────────────────
// Profile API Routes
// ─────────────────────────────────────────────────────────────
// GET  /api/profile — Read the current user's profile
// PATCH /api/profile — Partially update the current user's profile
//
// Protected: requires valid Supabase session (enforced by
// getProfile/updateProfile via requireAuthenticatedUser).
// Type-safe: request body validated with Zod, responses typed
// with ApiResponse<Profile>.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProfile } from "@/features/profile/get-profile";
import { updateProfile } from "@/features/profile/update-profile";
import type { ApiResponse } from "@/types/api";
import type { Profile } from "@/types/profile";
import { HttpStatus } from "@/types/api";

// ── GET /api/profile ────────────────────────────────────────

export async function GET(): Promise<
  NextResponse<ApiResponse<Profile>>
> {
  const result = await getProfile();

  if (!result.success) {
    const status =
      result.error.code === "authentication_required"
        ? HttpStatus.UNAUTHORIZED
        : result.error.code === "profile_not_found"
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;

    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: HttpStatus.OK });
}

// ── PATCH /api/profile ──────────────────────────────────────

export async function PATCH(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Profile>>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "validation_error", message: "Invalid JSON body" },
      },
      { status: HttpStatus.BAD_REQUEST },
    );
  }

  const result = await updateProfile(body);

  if (!result.success) {
    const status =
      result.error.code === "authentication_required"
        ? HttpStatus.UNAUTHORIZED
        : result.error.code === "validation_error"
          ? HttpStatus.UNPROCESSABLE_ENTITY
          : result.error.code === "profile_not_found"
            ? HttpStatus.NOT_FOUND
            : HttpStatus.INTERNAL_SERVER_ERROR;

    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: HttpStatus.OK });
}

// ── Method not allowed ─────────────────────────────────────

export async function POST(): Promise<
  NextResponse<ApiResponse<never>>
> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "method_not_allowed",
        message: "Profile is created automatically on sign-up",
      },
    },
    { status: HttpStatus.METHOD_NOT_ALLOWED },
  );
}

export async function DELETE(): Promise<
  NextResponse<ApiResponse<never>>
> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "method_not_allowed",
        message: "Profile cannot be deleted",
      },
    },
    { status: HttpStatus.METHOD_NOT_ALLOWED },
  );
}
