import type { Express, NextFunction, Request, Response } from "express";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { storage } from "./storage";

declare module "express-serve-static-core" {
  interface Request {
    authUserId?: string;
    authUsername?: string;
  }
}

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const registerSchema = loginSchema;

type AuthTokenPayload = {
  sub: string;
  username: string;
  exp: number;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }

  return "dev-insecure-jwt-secret-change-me";
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signJwt(payload: AuthTokenPayload): string {
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const body = base64UrlJson(payload);
  const data = `${header}.${body}`;
  const signature = createHmac("sha256", getJwtSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyJwt(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const data = `${header}.${body}`;
  const expectedSignature = createHmac("sha256", getJwtSecret()).update(data).digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AuthTokenPayload;
  if (typeof parsed.exp !== "number" || parsed.exp * 1000 <= Date.now()) {
    return null;
  }

  return parsed;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored.startsWith("scrypt$")) {
    return stored === password;
  }

  const [, salt, expected] = stored.split("$");
  if (!salt || !expected) return false;

  const hash = scryptSync(password, salt, 64).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (hashBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, expectedBuffer);
}

function issueToken(userId: string, username: string): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
  return signJwt({ sub: userId, username, exp });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[AUDIT] Unauthorized access: missing or malformed Authorization header`);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  const payload = verifyJwt(token);
  if (!payload) {
    console.warn(`[AUDIT] Unauthorized access: invalid or expired token`);
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  req.authUserId = payload.sub;
  req.authUsername = payload.username;
  next();
}

export async function registerAuthRoutes(app: Express): Promise<void> {
  const bootstrapUsername = process.env.AUTH_BOOTSTRAP_USERNAME;
  const bootstrapPassword = process.env.AUTH_BOOTSTRAP_PASSWORD;

  if (bootstrapUsername && bootstrapPassword) {
    const existing = await storage.getUserByUsername(bootstrapUsername);
    if (!existing) {
      await storage.createUser({
        username: bootstrapUsername,
        password: hashPassword(bootstrapPassword),
      });
    }
  }

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const allowSignup = process.env.AUTH_ALLOW_SIGNUP === "true";
    if (!allowSignup) {
      console.info(`[AUDIT] Signup attempt blocked for username=${req.body?.username ?? "unknown"}`);
      return res.status(403).json({ message: "Signup is disabled" });
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Atribuir admin ao primeiro usuário ou conforme lógica
    const role = parsed.data.username === "admin" ? "admin" : "user";
    const user = await storage.createUser({
      username: parsed.data.username,
      password: hashPassword(parsed.data.password),
      role,
    });

    const token = issueToken(user.id, user.username);
    console.info(`[AUDIT] Signup success username=${user.username} id=${user.id}`);
    return res.status(201).json({ token, user: { id: user.id, username: user.username } });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    const user = await storage.getUserByUsername(parsed.data.username);
    if (!user || !verifyPassword(parsed.data.password, user.password)) {
      console.warn(`[AUDIT] Login failed username=${parsed.data.username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password.startsWith("scrypt$")) {
      await storage.updateUserPassword(user.id, hashPassword(parsed.data.password));
    }

    const token = signJwt({ sub: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 });
    console.info(`[AUDIT] Login success username=${user.username} id=${user.id}`);
    return res.json({ token, user: { id: user.id, username: user.username } });
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    console.info(`[AUDIT] Logout endpoint called`);
    return res.status(204).send();
  });
}
