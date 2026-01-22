import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addCorsHeaders, handleOptions } from "@/lib/cors";

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    const response = NextResponse.json({
      authenticated: !!session?.user,
      user: session?.user ? {
        id: session.user.id,
        role: session.user.role,
      } : null,
    });
    
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error("Check auth error:", error);
    const response = NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
    return addCorsHeaders(request, response);
  }
}

