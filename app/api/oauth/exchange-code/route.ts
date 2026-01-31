import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
 try {
  const code = request.headers.get('code');
  if(!code) return NextResponse.json(
      { error: "notfound", error_description: "userId not found." },
      { status: 404 }
    );
  
  // gate the user data based on  this id 
  const user = await prisma.user.findUnique({
    where: {
      id: code,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", error_description: "User not found." },
      { status: 401 }
    );
  }
  // return the user data
  return NextResponse.json(user);
  
 } catch (error) {
  console.error("Exchange code error:", error);
  return NextResponse.json(
    { error: "server_error", error_description: "An internal error occurred" },
    { status: 500 }
  );
 }   
}
