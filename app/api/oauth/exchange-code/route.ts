import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { oauthCodes } from "@/lib/oauth-codes";
import { addCorsHeaders, handleOptions } from "@/lib/cors";

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// Normalize input from body or query string
async function readInput(request: NextRequest) {
  let code: string | null = null;
  let userId: string | null = null;

  // Query params
  const sp = request.nextUrl.searchParams;
  code = sp.get("code") || null;
  userId = sp.get("userId") || null;

  // JSON body (if present)
  try {
    if (!code && !userId) {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json().catch(() => null);
        if (body && typeof body === "object") {
          code = body.code ?? code;
          userId = body.userId ?? userId;
        }
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await request.text().catch(() => "");
        const params = new URLSearchParams(text);
        code = params.get("code") || code;
        userId = params.get("userId") || userId;
      }
    }
  } catch {
    // ignore body parse errors
  }

  return { code, userId };
}

// Core resolver: prefer code verification; allow userId fallback for dev
async function resolveUserIdFromInput(code: string | null, userId: string | null) {
  // If we have a valid OAuth code, verify it
  if (code) {
    const stored = oauthCodes.get(code);
    if (!stored) {
      return { error: { status: 400, body: { error: "invalid_code", error_description: "Code not found or expired" } } };
    }
    const now = new Date();
    if (stored.used || stored.expiresAt < now) {
      return { error: { status: 400, body: { error: "invalid_code", error_description: "Code used or expired" } } };
    }
    // Mark as used and return associated userId
    stored.used = true;
    oauthCodes.set(code, stored);
    return { userId: stored.userId };
  }

  // Dev fallback: allow direct userId exchange only if explicitly provided
  if (userId) {
    return { userId };
  }

  return { error: { status: 400, body: { error: "invalid_request", error_description: "code or userId is required" } } };
}

async function exchange(request: NextRequest) {
  try {
    const { code, userId } = await readInput(request);
    const result = await resolveUserIdFromInput(code, userId);
    if ("error" in result) {
      const response = NextResponse.json(result.error.body, { status: result.error.status });
      return addCorsHeaders(request, response);
    }

    // Fetch user by resolved userId
    const user = await prisma.user.findUnique({
      where: { id: result.userId as string },
      select: {
        id: true,
        username: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        country: true,
        status: true,
        balance: true,
        age: true,
        gender: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: "user_not_found", error_description: "User not found" },
        { status: 404 },
      );
      return addCorsHeaders(request, response);
    }

    // Return plain user object (consumer supports this shape)
    const response = NextResponse.json({
      id: user.id,
      role: user.role,
      firstName: user.firstName || "",
      fatherName: user.fatherName || "",
      lastName: user.lastName || "",
      gender: user.gender || null,
      age: user.age || 0,
      phoneNumber: user.phoneNumber || "",
      country: user.country || "",
      username: user.username || "",
      balance: user.balance || 0,
      status: user.status || "active",
    });
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error("Exchange code error:", error);
    const response = NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 },
    );
    return addCorsHeaders(request, response);
  }
}

export async function POST(request: NextRequest) {
  return exchange(request);
}

export async function GET(request: NextRequest) {
  return exchange(request);
}
