import type { NextAuthConfig } from "next-auth";
import { role as Role } from "@prisma/client";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}

export const authConfig = {
  pages: {
    signIn: "/am/login",
    signOut: "/am/logout",
  },
  trustHost: true,
  callbacks: {
    authorized: async ({ auth, request: { nextUrl } }) => {
      // Allow OAuth routes to handle their own flow
      if (nextUrl.pathname.includes("/oauth")) {
        return true;
      }

      if (auth?.user) {
        const pathname = nextUrl.pathname.split("/");
        if (
          ["am", "en", "or"].includes(pathname[1]) &&
          pathname[2] !== "dashboard"
        ) {
          return Response.redirect(
            new URL(
              `/${nextUrl.pathname.split(`/`)[1] || "am"}/dashboard/`,
              nextUrl
            )
          );
        } else return true;
      } else {
        if (nextUrl.pathname.split(`/`)[2] == "dashboard") {
          return false;
        } else return true;
      }
    },
    jwt: async ({ token, user }) => {
      if (user) {
        return { ...token, ...user };
      }
      return token;
    },
    session: async ({ session, token }) => {
      return { ...session, user: { ...session.user, ...token } };
    },
  },
  providers: [], // Providers will be added in auth.ts
} satisfies NextAuthConfig;
