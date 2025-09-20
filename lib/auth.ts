import NextAuth, { CredentialsSignin, NextAuthConfig } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/zodSchema";
import { role as Role } from "@prisma/client";

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

export class CustomError extends CredentialsSignin {
  constructor(message: string) {
    super();
    this.code = message;
    this.message = message;
  }
}

const authConfig = {
  pages: {
    signIn: "/am/login",
    signOut: "/am/logout",
  },
  // trustHost: true,
  callbacks: {
    authorized: async ({ auth, request: { nextUrl } }) => {
      // console.log("AK >> ", !!auth, nextUrl.pathname);
      if (auth?.user) {
        const pathname = nextUrl.pathname.split("/");
        if (["am", "en"].includes(pathname[1]) && pathname[2] !== "dashboard") {
          console.log("AK >> ", nextUrl.pathname);
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
          // ?
        } else return true;
      }
    },
    jwt: async ({ token, user }) => {
      return { ...token, ...user };
    },
    session: async ({ session, token }) => {
      return { ...session, user: { ...session.user, ...token } };
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const { username, password } = await loginSchema.parseAsync(
          credentials
        );
        const user = await prisma.user.findFirst({
          where: { username },
          select: { id: true, role: true, password: true },
        });

        if (!user) throw new CustomError("username is incorrect");

        if (await bcryptjs.compare(password, user.password)) {
          return { id: user.id, role: user.role };
        } else throw new CustomError("password is incorrect");
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
