import { NextRequest, NextResponse } from "next/server";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://alanistilawa.com",
  "https://www.alanistilawa.com",
  "http://alanistilawa.com",
  "https://alanisquran.com",
  "https://www.alanisquran.com",
  "http://alanisquran.com",
  "http://localhost",
  "https://localhost",
];

// Check if origin is allowed
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Check localhost with any port
  if (origin.startsWith("http://localhost:") || origin.startsWith("https://localhost:")) {
    return true;
  }
  
  return false;
}

// Add CORS headers to response
export function addCorsHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const origin = request.headers.get("origin");
  
  if (origin && isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  
  return response;
}

// Handle OPTIONS request (preflight)
export function handleOptions(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(request, response);
}

