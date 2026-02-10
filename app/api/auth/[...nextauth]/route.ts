import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/prisma/prisma-client";
import { compare } from "bcrypt";

// Налаштування авторизації
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      authorize: async (credentials) => {
        if (!credentials) {
          return null;
        }
        console.log(credentials.email);
        const user = await prisma.employee.findFirst({
          where: { email: credentials.email },
        });
        if (!user) {
          return null;
        }

        if (user.password !== credentials.password) {
          return null;
        }

        return {
          id: user.employee_id.toString(),
          email: user.email,
          fullName: `${user.last_name} ${user.first_name} ${user.middle_name}`,
          role: user.db_role || "unknown",
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as CustomUser;
        token.id = u.id;
        token.email = u.email;
        token.role = u.role; // db_role
        token.fullName = u.fullName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.fullName = token.fullName as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
