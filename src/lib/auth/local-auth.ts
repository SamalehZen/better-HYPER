import "server-only";
export const runtime = "nodejs";
import { hash as bcryptHash, compare as bcryptCompare } from "bcrypt-ts";
import { cookies } from "next/headers";
import { pgDb } from "lib/db/pg/db.pg";
import { UserTable, SessionTable } from "lib/db/pg/schema.pg";
import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { userRepository } from "lib/db/repository";

export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
    preferences: any;
  };
};

const SESSION_COOKIE_NAME = "session_token";
const SESSION_EXPIRY_DAYS = 7;
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcryptHash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return await bcryptCompare(password, hashedPassword);
  } catch {
    return false;
  }
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<string> {
  const token = nanoid();
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await pgDb.insert(SessionTable).values({
    userId,
    token,
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  await setSessionCookie(token);
  return token;
}

export async function getSessionByToken(
  token: string,
): Promise<Session | null> {
  const now = new Date();

  const [row] = await pgDb
    .select({
      session: SessionTable,
      user: UserTable,
    })
    .from(SessionTable)
    .innerJoin(UserTable, eq(UserTable.id, SessionTable.userId))
    .where(and(eq(SessionTable.token, token), gt(SessionTable.expiresAt, now)))
    .limit(1);

  if (!row) return null;

  const user = row.user;

  if (user.banned) {
    if (!user.banExpires || user.banExpires > now) {
      return null;
    }
  }

  return {
    id: row.session.id,
    userId: row.session.userId,
    token: row.session.token,
    expiresAt: row.session.expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      role: user.role,
      banned: user.banned ?? null,
      banReason: user.banReason ?? null,
      banExpires: user.banExpires ?? null,
      preferences: user.preferences,
    },
  };
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await getSessionByToken(token);
}

export async function deleteSession(token: string): Promise<void> {
  await pgDb.delete(SessionTable).where(eq(SessionTable.token, token));
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await pgDb.delete(SessionTable).where(eq(SessionTable.userId, userId));
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; email: string; name: string }> {
  const exists = await userRepository.existsByEmail(data.email);
  if (exists) {
    throw new Error("Email already in use");
  }

  const isFirst = await getIsFirstUser();
  const passwordHash = await hashPassword(data.password);

  const [user] = await pgDb
    .insert(UserTable)
    .values({
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: isFirst ? "admin" : "user",
    })
    .returning({
      id: UserTable.id,
      email: UserTable.email,
      name: UserTable.name,
    });

  return user;
}

export async function signIn(
  email: string,
  password: string,
): Promise<Session | null> {
  const [user] = await pgDb
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email))
    .limit(1);

  if (!user || !user.password) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  const now = new Date();
  if (user.banned && (!user.banExpires || user.banExpires > now)) {
    return null;
  }

  const token = await createSession(user.id);
  const session = await getSessionByToken(token);
  return session;
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSession(token);
  }
  await deleteSessionCookie();
}

let isFirstUserCache: boolean | null = null;
export async function getIsFirstUser(): Promise<boolean> {
  if (isFirstUserCache === false) return false;
  try {
    const count = await userRepository.getUserCount();
    const isFirst = count === 0;
    if (!isFirst) isFirstUserCache = false;
    return isFirst;
  } catch {
    isFirstUserCache = false;
    return false;
  }
}

async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProd =
    process.env.NODE_ENV === "production" && process.env.NO_HTTPS !== "1";
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export { setSessionCookie, deleteSessionCookie };
