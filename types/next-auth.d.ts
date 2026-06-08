import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    jwt?: string;
    user: {
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    jwt?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jwt?: string;
    role?: string;
    id?: string;
  }
}
