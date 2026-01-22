import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { oauthCodes } from "@/lib/oauth-codes";
import { randomBytes } from "crypto";
import { addCorsHeaders, handleOptions } from "@/lib/cors";

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      const response = NextResponse.json(
        { error: "unauthorized", error_description: "User not authenticated" },
        { status: 401 }
      );
      return addCorsHeaders(request, response);
    }

    // Generate a secure random code
    const code = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Code expires in 5 minutes

    // Store code with user ID
    oauthCodes.set(code, {
      userId: session.user.id,
      expiresAt,
      used: false,
    });

    const response = NextResponse.json({
      code,
      expiresIn: 300, // 5 minutes in seconds
    });
    
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error("Generate code error:", error);
    const response = NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 }
    );
    return addCorsHeaders(request, response);
  }
}

