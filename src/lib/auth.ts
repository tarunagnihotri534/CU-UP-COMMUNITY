"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  createSession,
  createUser,
  deleteSession,
  getSessionByToken,
  getUserByEmail,
} from "@/lib/db";
import type { PortalUser, Session, UserRole } from "@/types/portal";

const SESSION_COOKIE = "cu_portal_session";
const SESSION_HOURS = 24;

/* ── Password ───────────────────────────────────────────── */

export async function hashPassword(password: string, salt?: string) {
  const s = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHmac("sha256", s).update(password).digest("hex");
  return { hash, salt: s };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  const { hash: h } = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
}

/* ── Session ────────────────────────────────────────────── */

export async function createSessionForUser(user: PortalUser): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_HOURS * 3600 * 1000,
  ).toISOString();
  const session: Session = {
    token,
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  await createSession(session);
  return token;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionFromCookie(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionByToken(token);
}

export async function getTokenFromCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function ensureDefaultStaff() {
  const existing = await getUserByEmail("staff@cuup.in");
  if (!existing) {
    const { hash, salt } = await hashPassword("Staff@2024");
    await createUser({
      id: "staff-001",
      name: "CU-UP Admin",
      email: "staff@cuup.in",
      password: hash,
      salt,
      role: "staff",
      staffId: "STAFF001",
      department: "Administration",
      createdAt: new Date().toISOString(),
    });
  }

  // Seed Dr. Vikash Kumar Mishra (IEEE Branch Counselor)
  const existingIEEE = await getUserByEmail("vikash.mishra@cuup.in");
  if (!existingIEEE) {
    const { hash, salt } = await hashPassword("IEEE@2024");
    await createUser({
      id: "staff-ieee-001",
      name: "Dr. Vikash Kumar Mishra",
      email: "vikash.mishra@cuup.in",
      password: hash,
      salt,
      role: "staff",
      staffId: "L100357",
      department: "School of Computer Science and Engineering",
      createdAt: new Date().toISOString(),
    });
  }
}

/* ── Auth helpers ───────────────────────────────────────── */

export async function loginUser(
  email: string,
  password: string,
): Promise<
  | { success: true; token: string; role: UserRole; name: string }
  | { success: false; error: string }
> {
  await ensureDefaultStaff();
  const user = await getUserByEmail(email);
  if (!user) return { success: false, error: "Invalid email or password" };
  if (!(await verifyPassword(password, user.password, user.salt)))
    return { success: false, error: "Invalid email or password" };
  const token = await createSessionForUser(user);
  return { success: true, token, role: user.role, name: user.name };
}

export async function registerStudent(data: {
  name: string;
  email: string;
  password: string;
  enrollmentNo?: string;
  department?: string;
}): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  const existing = await getUserByEmail(data.email);
  if (existing) return { success: false, error: "Email already registered" };
  const { hash, salt } = await hashPassword(data.password);
  const id = `student-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const user: PortalUser = {
    id,
    name: data.name,
    email: data.email,
    password: hash,
    salt,
    role: "student",
    enrollmentNo: data.enrollmentNo,
    department: data.department,
    createdAt: new Date().toISOString(),
  };
  await createUser(user);
  const token = await createSessionForUser(user);
  return { success: true, token };
}

export async function logoutUser(token: string) {
  await deleteSession(token);
}
