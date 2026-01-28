import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // REST-Endpoint für Auth-Bootstrap (nicht tRPC!)
  // Grund: OAuth-Flows sind redirect-basiert und müssen vor tRPC-Initialisierung abgeschlossen sein
  app.post("/api/auth/exchange-session", async (req, res) => {
    try {
      const { exchangeToken } = req.body;
      
      if (!exchangeToken) {
        return res.status(400).json({ success: false, error: "Token fehlt" });
      }
      
      // Import dynamisch um zirkuläre Abhängigkeiten zu vermeiden
      const { verifyExchangeToken, createToken } = await import("../auth");
      const { getSessionCookieOptions } = await import("./cookies");
      const { COOKIE_NAME } = await import("../../shared/const");
      
      const payload = verifyExchangeToken(exchangeToken);
      
      if (!payload) {
        return res.status(401).json({ success: false, error: "Ungültiges oder abgelaufenes Token" });
      }
      
      // Session-Token erstellen (7 Tage gültig)
      const sessionToken = createToken(payload.userId, payload.email, payload.role);
      
      // Cookie setzen
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
      });
      
      console.log("[Auth REST] Session cookie set for user:", payload.userId);
      
      return res.json({ success: true });
    } catch (error) {
      console.error("[Auth REST] Error:", error);
      return res.status(500).json({ success: false, error: "Interner Fehler" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
