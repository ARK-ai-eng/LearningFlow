import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

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

      // ============================================
      // E-MAIL IST DER EINZIGE IDENTIFIER
      // ============================================
      
      // 1. Prüfen ob User mit dieser E-Mail bereits existiert
      const existingUser = await db.getUserByEmail(email);
      
      // 2. Prüfen ob es der Owner ist (SysAdmin) - einzige Ausnahme
      const isOwner = userInfo.openId === ENV.ownerOpenId;
      
      // 3. Prüfen ob eine gültige Einladung für diese E-Mail existiert
      const invitation = await db.getActiveInvitationByEmail(email);

      // FALL 1: User existiert bereits → Login erlauben, openId aktualisieren
      if (existingUser) {
        await db.upsertUser({
          openId: userInfo.openId,
          email: email,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(userInfo.openId, {
          name: userInfo.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        if (returnTo && returnTo.startsWith("/")) {
          res.redirect(302, returnTo);
        } else {
          res.redirect(302, "/");
        }
        return;
      }

      // FALL 2: Owner (SysAdmin) → Immer erlauben, User erstellen falls nicht existiert
      if (isOwner) {
        await db.upsertUser({
          openId: userInfo.openId,
          email: email,
          name: userInfo.name || null,
          role: 'sysadmin',
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(userInfo.openId, {
          name: userInfo.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        res.redirect(302, "/");
        return;
      }

      // FALL 3: Gültige Einladung vorhanden → Session erstellen, aber User wird erst bei invitation.accept erstellt
      if (invitation) {
        const sessionToken = await sdk.createSessionToken(userInfo.openId, {
          name: userInfo.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        // Zurück zur Einladungsseite
        if (returnTo && returnTo.startsWith("/invite/")) {
          res.redirect(302, returnTo);
        } else {
          res.redirect(302, `/invite/${invitation.token}`);
        }
        return;
      }

      // FALL 4: Kein User, kein Owner, keine Einladung → Zugang verweigert
      res.redirect(302, "/?error=no_invitation");

    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
