import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h"; // Token expires in 24 hours

export async function POST() {
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

    // Return token and user data
    return NextResponse.json({
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
  } catch (error) {
    console.error("Generate token error:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 }
    );
  }
}

