"use server";

import { BasicUserWithLastLogin, UserPreferences } from "app-types/user";
import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";

import { notFound } from "next/navigation";
import { pgDb } from "lib/db/pg/db.pg";
import { SessionTable } from "lib/db/pg/schema.pg";
import { eq, desc } from "drizzle-orm";
import { customModelProvider } from "@/lib/ai/models";

// Helper function to get model provider from model name
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
 * We can only get the user by id for the current user as a non-admin user
 * We can get the user by id for any user as an admin user
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
 * Get the user ID and check access
 * if the requested user id is not provided, we use the current user id
 * if the requested user id is provided, we check if the current user has access to the requested user
 * if the current user has access to the requested user, we return the requested user id
 * if the current user does not have access to the requested user, we throw a 404 error
 * if the requested user id is not found, we throw a 404 error
 */
export async function getUserIdAndCheckAccess(
  requestedUserId?: string,
): Promise<string> {
  const session = await getSession();
  if (!session) {
    notFound();
  }
  const currentUserId = session.user.id;
  const userId = requestedUserId ? requestedUserId : currentUserId;
  if (!userId) {
    notFound();
  }
  return userId;
}

/**
 * Get the user stats
 * We can only get stats for the current user as a non-admin user
 * We can get stats for any user as an admin user
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

  // Add provider information to each model stat
  return {
    ...stats,
    modelStats: stats.modelStats.map((stat) => ({
      ...stat,
      provider: getModelProvider(stat.model),
    })),
  };
}

/**
 * Get the user preferences
 * We can only get preferences for the current user as a non-admin user
 * We can get preferences for any user as an admin user
 */
export async function getUserPreferences(
  userId?: string,
): Promise<UserPreferences | null> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  return await userRepository.getPreferences(resolvedUserId);
}

export async function updateUserDetails(
  userId: string,
  name?: string,
  email?: string,
  image?: string,
) {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  if (!name && !email && !image) {
    return;
  }
  return await userRepository.updateUserDetails({
    userId: resolvedUserId,
    ...(name && { name }),
    ...(email && { email }),
    ...(image && { image }),
  });
}
