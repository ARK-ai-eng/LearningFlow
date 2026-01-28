import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { verifyToken } from "../auth";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Token aus Authorization Header (Hauptmethode) oder Cookie (Fallback) lesen
    let token: string | undefined;
    
    // 1. Versuche Authorization Header (Bearer Token)
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    
    // 2. Fallback: Cookie
    if (!token) {
      token = opts.req.cookies?.[COOKIE_NAME];
    }
    
    console.log("[Auth] Token source:", authHeader ? "header" : "cookie", "Token present:", !!token);
    
    if (token) {
      const decoded = verifyToken(token);
      
      if (decoded) {
        // User aus DB laden
        const dbUser = await db.getUserById(decoded.userId);
        if (dbUser) {
          user = dbUser;
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
