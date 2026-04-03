import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.ZOOM_Client_ID;
  const authUrl = process.env.AUTH_URL || "http://localhost:3000";
  const redirectUri = `${authUrl}/api/zoom/callback`;

  const zoomAuthUrl = new URL("https://zoom.us/oauth/authorize");
  zoomAuthUrl.searchParams.set("response_type", "code");
  zoomAuthUrl.searchParams.set("client_id", clientId!);
  zoomAuthUrl.searchParams.set("redirect_uri", redirectUri);
  
  // We can pass the referer so we know where to redirect back
  const referer = request.headers.get("referer") || `${authUrl}/am/dashboard/profile`;
  zoomAuthUrl.searchParams.set("state", referer);
  
  return NextResponse.redirect(zoomAuthUrl.toString());
}
