import { NextRequest, NextResponse } from "next/server";
import { oauthCodes } from "@/lib/oauth-codes";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
import { auth } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h"; // Token expires in 24 hours

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// Handle GET request - Return logged-in user data if authenticated
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      const response = NextResponse.json(
        { error: "unauthorized", error_description: "User not authenticated. Please login first." },
        { status: 401 }
      );
      return addCorsHeaders(request, response);
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        { status: 404 }
      );
      return addCorsHeaders(request, response);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return token and user data with CORS headers
    const response = NextResponse.json({
      token,
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
      expiresIn: 86400, // 24 hours in seconds
    });
    
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error("Get user data error:", error);
    const response = NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 }
    );
    return addCorsHeaders(request, response);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      const response = NextResponse.json(
        { error: "invalid_request", error_description: "Code is required" },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Find the code
    const codeData = oauthCodes.get(code);

    if (!codeData) {
      const response = NextResponse.json(
        { error: "invalid_code", error_description: "Invalid or expired code" },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Check if code has expired
    if (new Date() > codeData.expiresAt) {
      oauthCodes.delete(code);
      const response = NextResponse.json(
        { error: "expired_code", error_description: "Code has expired" },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Check if code has already been used
    if (codeData.used) {
      const response = NextResponse.json(
        { error: "code_already_used", error_description: "Code has already been used" },
        { status: 400 }
      );
      return addCorsHeaders(request, response);
    }

    // Mark code as used
    codeData.used = true;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: codeData.userId },
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
      oauthCodes.delete(code);
      const response = NextResponse.json(
        { error: "user_not_found", error_description: "User not found" },
        { status: 404 }
      );
      return addCorsHeaders(request, response);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Delete the code after successful exchange
    oauthCodes.delete(code);

    // Return token and user data with CORS headers
    const response = NextResponse.json({
      token,
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
      expiresIn: 86400, // 24 hours in seconds
    });
    
    return addCorsHeaders(request, response);
  } catch (error) {
    console.error("Exchange code error:", error);
    const response = NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 }
    );
    return addCorsHeaders(request, response);
  }
}

