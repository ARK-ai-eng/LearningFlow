import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { createToken } from "../auth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Decode state und extrahiere returnTo falls vorhanden
function decodeState(state: string): { callbackUrl: string; returnTo: string | null } {
  try {
    const decoded = atob(state);
    try {
      const parsed = JSON.parse(decoded);
      return {
        callbackUrl: parsed.callbackUrl || decoded,
        returnTo: parsed.returnTo || null
      };
    } catch {
      return {
        callbackUrl: decoded,
        returnTo: null
      };
    }
  } catch {
    return {
      callbackUrl: "",
      returnTo: null
    };
  }
}

export function registerOAuthRoutes(app: Express) {
  // Manus OAuth nur für SysAdmin (Owner)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId || !userInfo.email) {
        res.status(400).json({ error: "openId or email missing from user info" });
        return;
      }

      const email = userInfo.email.toLowerCase();
      const { returnTo } = decodeState(state);

      // NUR OWNER (SysAdmin) darf sich via Manus OAuth anmelden
      const isOwner = userInfo.openId === ENV.ownerOpenId;
      
      if (!isOwner) {
        // Alle anderen müssen sich über E-Mail + Passwort anmelden
        res.redirect(302, "/?error=use_email_login");
        return;
      }

      // Owner: Prüfen ob bereits existiert
      let user = await db.getUserByEmail(email);
      
      if (!user) {
        // SysAdmin erstellen
        const userId = await db.createUser({
          email: email,
          name: userInfo.name || null,
          role: 'sysadmin',
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        });
        user = await db.getUserById(userId);
      } else {
        // LastSignedIn aktualisieren
        await db.updateUserLastSignedIn(user.id);
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // JWT Token erstellen (eigenes System)
      const token = createToken(user.id, user.email, user.role);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.redirect(302, "/");

    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
