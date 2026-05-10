import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

let _auth: ReturnType<typeof betterAuth> | null = null;

function initAuth() {
  try {
    _auth = betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql",
      }),
      emailAndPassword: {
        enabled: true,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60,
        },
      },
    });
  } catch (e) {
    // Build-time stub — auth will init properly at runtime with env vars
  }
  return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    if (!_auth) initAuth();
    if (!_auth) throw new Error("Auth not initialized");
    return Reflect.get(_auth, prop, _auth);
  },
});