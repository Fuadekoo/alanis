import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addCorsHeaders, handleOptions } from "@/lib/cors";

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// Handle GET request - Return only the logged-in user's ID
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      const response = NextResponse.json(
        { error: "unauthorized", error_description: "User not authenticated." },
        { status: 401 }
      );
      return addCorsHeaders(request, response);
    }

    // Return only the user ID
    const response = NextResponse.json({
      userId: session.user.id,
    });
    
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error("Get user ID error:", error);
    const response = NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 }
    );
    return addCorsHeaders(request, response);
  }
}
