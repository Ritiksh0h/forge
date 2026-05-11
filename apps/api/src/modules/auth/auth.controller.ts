import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, profiles } from "../../db/schema.js";
import { signToken } from "../../middleware/auth.js";
import { env } from "../../config/env.js";
import { sendEmail, resetPasswordEmail } from "../../lib/email.js";

const SALT_ROUNDS = 12;

// ─── Verify Google ID token ───
async function verifyGoogleToken(idToken: string): Promise<{ email: string; sub: string; name?: string } | null> {
  try {
    // Use Google's tokeninfo endpoint — no SDK needed
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) return null;
    const data = await res.json();

    // Verify audience matches our client ID
    if (env.GOOGLE_CLIENT_ID && data.aud !== env.GOOGLE_CLIENT_ID) return null;

    return { email: data.email, sub: data.sub, name: data.name };
  } catch {
    return null;
  }
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email, createdAt: users.createdAt });

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "This account uses Google sign-in" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    token,
  });
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ error: "Missing idToken" });
    return;
  }

  const googleUser = await verifyGoogleToken(idToken);
  if (!googleUser) {
    res.status(401).json({ error: "Invalid Google token" });
    return;
  }

  // Check if user exists by google_id or email
  let user = await db.query.users.findFirst({
    where: eq(users.googleId, googleUser.sub),
  });

  if (!user) {
    // Check by email (might have signed up with password first)
    user = await db.query.users.findFirst({
      where: eq(users.email, googleUser.email),
    });

    if (user) {
      // Link Google account to existing user
      await db.update(users).set({ googleId: googleUser.sub }).where(eq(users.id, user.id));
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({ email: googleUser.email, googleId: googleUser.sub })
        .returning();
      user = newUser;
    }
  }

  const token = signToken({ userId: user.id, email: user.email });
  const existingProfile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });

  res.json({
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    token,
    isNewUser: !existingProfile,
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ message: "Logged out" });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, req.user!.userId),
    columns: { id: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
}

// ─── Forgot Password ───
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  // Always return success to prevent email enumeration
  const successMsg = "If an account exists with that email, a reset link has been sent.";

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    res.json({ message: successMsg });
    return;
  }

  // Google-only accounts can't reset password
  if (!user.passwordHash && user.googleId) {
    res.json({ message: successMsg });
    return;
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.update(users).set({
    resetToken: token,
    resetTokenExpiresAt: expiresAt,
  }).where(eq(users.id, user.id));

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const { subject, html } = resetPasswordEmail(resetUrl);
  await sendEmail({ to: email, subject, html });

  res.json({ message: successMsg });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.resetToken, token),
  });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.update(users).set({
    passwordHash,
    resetToken: null,
    resetTokenExpiresAt: null,
  }).where(eq(users.id, user.id));

  res.json({ message: "Password reset successfully" });
}
