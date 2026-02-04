import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function OPTIONS(){
  return NextResponse.json({
     headers: {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     }
     })
}

export async function POST(request: NextRequest) {
 try {
  const code = request.nextUrl.searchParams.get('code');
  if(!code) {
    const response = NextResponse.json(
      { error: "notfound", error_description: "userId not found." },
      { status: 404 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
  
  // gate the user data based on  this id 
  const user = await prisma.user.findUnique({
    where: {
      id: code,
    },
  });

  if (!user) {
    const response = NextResponse.json(
      { error: "unauthorized", error_description: "User not found." },
      { status: 401 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
  
  // return the user data
  const response = NextResponse.json(user);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  return response;
  
 } catch (error) {
  console.error("Exchange code error:", error);
  const response = NextResponse.json(
    { error: "server_error", error_description: "An internal error occurred" },
    { status: 500 }
  );
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
 }   
}
