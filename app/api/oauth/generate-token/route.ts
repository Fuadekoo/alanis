import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", error_description: "User not authenticated" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "user_not_found", error_description: "User not found" },
        { status: 404 }
      );
    }

    // Get the actual session token from cookies
    const cookieStore = await cookies();
    const sessionToken = 
      cookieStore.get("__Secure-authjs.session-token")?.value || 
      cookieStore.get("authjs.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "token_not_found", error_description: "Session token not found in cookies" },
        { status: 400 }
      );
    }

    // Return the session token and user data
    return NextResponse.json({
      token: sessionToken,
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
  } catch (error) {
    console.error("Generate token error:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 }
    );
  }
}

