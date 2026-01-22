import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";
import { addCorsHeaders, handleOptions } from "@/lib/cors";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      const response = NextResponse.json(
        { valid: false, error: "invalid_request", error_description: "Token is required" },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Verify JWT token
    interface JwtPayload {
      sub: string;
      username: string;
      role: string;
      iat: number;
      exp: number;
    }
    
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Token verification failed";
      const response = NextResponse.json(
        { 
          valid: false,
          error: "invalid_token",
          error_description: errorMessage
        },
        { status: 401 }
      );
      return addCorsHeaders(request, response);
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
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
        { 
          valid: false,
          error: "user_not_found",
          error_description: "User associated with token not found" 
        },
        { status: 404 }
      );
      return addCorsHeaders(request, response);
    }

    // Return token verification result with user data
    const response = NextResponse.json({
      valid: true,
      token: {
        sub: decoded.sub,
        username: decoded.username,
        role: decoded.role,
        issued_at: decoded.iat,
        expires_at: decoded.exp,
      },
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        fatherName: user.fatherName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.fatherName} ${user.lastName}`.trim(),
        role: user.role,
        phoneNumber: user.phoneNumber,
        country: user.country,
        status: user.status,
        balance: user.balance,
        age: user.age,
        gender: user.gender,
      },
    });
    
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error("Verify token error:", error);
    const response = NextResponse.json(
      { 
        valid: false,
        error: "server_error", 
        error_description: "An internal error occurred" 
      },
      { status: 500 }
    );
    return addCorsHeaders(request, response);
  }
}

// Also support GET method for easier integration
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      const response = NextResponse.json(
        { valid: false, error: "invalid_request", error_description: "Token parameter is required" },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Use the same logic as POST
    const body = { token };
    const requestWithBody = new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    return POST(requestWithBody);
  } catch (error) {
    console.error("Verify token GET error:", error);
    const response = NextResponse.json(
      { 
        valid: false,
        error: "server_error", 
        error_description: "An internal error occurred" 
      },
      { status: 500 }
    );
    return addCorsHeaders(request, response);
  }
}

