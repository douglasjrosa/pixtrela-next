import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    jwt?: string;
    user: {
      role?: string;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    jwt?: string;
    role?: string;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jwt?: string;
    role?: string;
    id?: string;
    avatarUrl?: string | null;
  }
}
