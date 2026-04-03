import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // this contains the referer URL
  
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.ZOOM_Client_ID;
  const clientSecret = process.env.ZOOM_Client_Secret;
  const authUrl = process.env.AUTH_URL || "http://localhost:3000";
  const redirectUri = `${authUrl}/api/zoom/callback`;

  try {
    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      throw new Error("Failed to exchange token");
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Profile fetch failed:", await userResponse.text());
      throw new Error("Failed to fetch user profile");
    }

    const zoomUser = await userResponse.json();

    const displayName = zoomUser.display_name || `${zoomUser.first_name || ""} ${zoomUser.last_name || ""}`.trim();

    await prisma.zoomAttach.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        zoomUserId: zoomUser.id,
        zoomEmail: zoomUser.email,
        zoomDisplayName: displayName,
        zoomAccountType: zoomUser.type === 1 ? "personal" : "pro",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
      update: {
        zoomUserId: zoomUser.id,
        zoomEmail: zoomUser.email,
        zoomDisplayName: displayName,
        zoomAccountType: zoomUser.type === 1 ? "personal" : "pro",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });

    const redirectBackUrl = state || `${authUrl}/am/dashboard/profile`;
    return NextResponse.redirect(redirectBackUrl);
  } catch (error) {
    console.error("Zoom callback error", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
