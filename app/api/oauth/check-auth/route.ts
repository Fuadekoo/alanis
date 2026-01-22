import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    
    return NextResponse.json({
      authenticated: !!session?.user,
      user: session?.user ? {
        id: session.user.id,
        role: session.user.role,
      } : null,
    });
  } catch (error) {
    console.error("Check auth error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}

