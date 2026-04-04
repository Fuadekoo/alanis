import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/zodSchema";
import { authConfig } from "./auth.config";

export class CustomError extends CredentialsSignin {
  constructor(message: string) {
    super();
    this.code = message;
    this.message = message;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
});
