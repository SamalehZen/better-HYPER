"use server";

import { BasicUserWithLastLogin, UserPreferences } from "app-types/user";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";

import { pgDb } from "lib/db/pg/db.pg";
import { SessionTable } from "lib/db/pg/schema.pg";
import { userRepository } from "lib/db/repository";
import { customModelProvider } from "@/lib/ai/models";

/**
 * Helper function to get model provider from model name
 */
const getModelProvider = (modelName: string): string => {
  for (const { provider, models } of customModelProvider.modelsInfo) {
    for (const model of models) {
      if (model.name === modelName) {
        return provider;
      }
    }
  }
  return "unknown";
};

/**
 * Get the user by id
 * - Non-admin: can only access own data
 * - Admin: can access any user
 */
export async function getUser(
  userId?: string,
): Promise<BasicUserWithLastLogin | null> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  return await userRepository.getUserById(resolvedUserId);
}

/**
 * List user sessions using local auth sessions
 */
export async function getUserSessions(userId?: string) {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  const rows = await pgDb
    .select()
    .from(SessionTable)
    .where(eq(SessionTable.userId, resolvedUserId))
    .orderBy(desc(SessionTable.createdAt));
  return rows;
}

/**
 * Get the user's authentication methods
 */
export async function getUserAuthMethods(userId?: string) {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  return await userRepository.getUserAuthMethods(resolvedUserId);
}

/**
 * Get the user ID and check access.
 * - If `requestedUserId` not provided → use current user
 * - If provided → check if current user has access
 * - Otherwise → throw 404
 */
export async function getUserIdAndCheckAccess(
  requestedUserId?: string,
): Promise<string> {
  const session = await getSession();
  if (!session) notFound();

  const currentUserId = session.user.id;
  const userId = requestedUserId || currentUserId;
  if (!userId) notFound();

  // ⚠️ (Optionnel) Si tu veux gérer le cas admin :
  // if (requestedUserId && requestedUserId !== currentUserId && !session.user.isAdmin) {
  //   notFound();
  // }

  return userId;
}

/**
 * Get the user stats
 * - Non-admin: only own stats
 * - Admin: can access any user's stats
 */
export async function getUserStats(userId?: string): Promise<{
  threadCount: number;
  messageCount: number;
  modelStats: Array<{
    model: string;
    messageCount: number;
    totalTokens: number;
    provider: string;
  }>;
  totalTokens: number;
  period: string;
}> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  const stats = await userRepository.getUserStats(resolvedUserId);

  // Add provider info to each model stat
  return {
    ...stats,
    modelStats: stats.modelStats.map((stat) => ({
      ...stat,
      provider: getModelProvider(stat.model),
    })),
  };
}

/**
 * Get user preferences
 */
export async function getUserPreferences(
  userId?: string,
): Promise<UserPreferences | null> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  return await userRepository.getPreferences(resolvedUserId);
}

/**
 * Update user profile details (name, email, image)
 */
export async function updateUserDetails(
  userId: string,
  name?: string,
  email?: string,
  image?: string,
) {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  if (!name && !email && !image) return;

  return await userRepository.updateUserDetails({
    userId: resolvedUserId,
    ...(name && { name }),
    ...(email && { email }),
    ...(image && { image }),
  });
}
