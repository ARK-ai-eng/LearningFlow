import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { createExchangeToken } from "../auth";

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
  // OAuth Provider nur für SysAdmin (Owner)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log("[OAuth] Callback received");
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    console.log("[OAuth] Code:", code ? "present" : "missing");
    console.log("[OAuth] State:", state ? "present" : "missing");

    if (!code || !state) {
      console.log("[OAuth] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Exchanging code for token...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token received, getting user info...");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info:", { openId: userInfo.openId, email: userInfo.email, name: userInfo.name });

      if (!userInfo.openId || !userInfo.email) {
        console.log("[OAuth] Missing openId or email");
        res.status(400).json({ error: "openId or email missing from user info" });
        return;
      }

      const email = userInfo.email.toLowerCase();
      const { returnTo } = decodeState(state);

      // NUR OWNER (SysAdmin) darf sich via OAuth Provider anmelden
      const isOwner = userInfo.openId === ENV.ownerOpenId;
      console.log("[OAuth] Is owner:", isOwner, "userOpenId:", userInfo.openId, "ownerOpenId:", ENV.ownerOpenId);
      
      if (!isOwner) {
        // Alle anderen müssen sich über E-Mail + Passwort anmelden
        console.log("[OAuth] Not owner, redirecting to use email login");
        res.redirect(302, "/?error=use_email_login");
        return;
      }

      // Owner: Prüfen ob bereits existiert
      let user = await db.getUserByEmail(email);
      console.log("[OAuth] Existing user:", user ? user.id : "none");
      
      if (!user) {
        // SysAdmin erstellen
        console.log("[OAuth] Creating new sysadmin user...");
        const userId = await db.createUser({
          email: email,
          name: userInfo.name || null,
          role: 'sysadmin',
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        });
        user = await db.getUserById(userId);
        console.log("[OAuth] Created user:", userId);
      } else {
        // LastSignedIn aktualisieren
        await db.updateUserLastSignedIn(user.id);
        console.log("[OAuth] Updated lastSignedIn for user:", user.id);
      }

      if (!user) {
        console.log("[OAuth] Failed to create/get user");
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Kurzlebiges Exchange-Token erstellen (60 Sekunden)
      const exchangeToken = createExchangeToken(user.id, user.email, user.role);
      console.log("[OAuth] Exchange token created, redirecting with token in URL");

      res.redirect(302, `/?exchange_token=${exchangeToken}`);

    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
