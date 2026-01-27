import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Decode state und extrahiere returnTo falls vorhanden
function decodeState(state: string): { callbackUrl: string; returnTo: string | null } {
  try {
    const decoded = atob(state);
    // Versuche als JSON zu parsen (neues Format)
    try {
      const parsed = JSON.parse(decoded);
      return {
        callbackUrl: parsed.callbackUrl || decoded,
        returnTo: parsed.returnTo || null
      };
    } catch {
      // Altes Format - state ist nur die callbackUrl
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

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email || "",
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // returnTo aus dem state extrahieren
      const { returnTo } = decodeState(state);
      if (returnTo && returnTo.startsWith("/")) {
        res.redirect(302, returnTo);
      } else {
        res.redirect(302, "/");
      }
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
