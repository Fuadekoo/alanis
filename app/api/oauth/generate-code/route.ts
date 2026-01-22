import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { oauthCodes } from "@/lib/oauth-codes";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", error_description: "User not authenticated" },
        { status: 401 }
      );
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

    return NextResponse.json({
      code,
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    console.error("Generate code error:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "An internal error occurred" },
      { status: 500 }
    );
  }
}

