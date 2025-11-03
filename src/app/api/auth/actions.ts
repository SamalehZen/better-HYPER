"use server";

import { createUser, createSession } from "auth/server";
import { BasicUser, UserZodSchema } from "app-types/user";
import { userRepository } from "lib/db/repository";
import { ActionState } from "lib/action-utils";

export async function existsByEmailAction(email: string) {
  const exists = await userRepository.existsByEmail(email);
  return exists;
}

type SignUpActionResponse = ActionState & {
  user?: BasicUser;
};

export async function signUpAction(data: {
  email: string;
  name: string;
  password: string;
}): Promise<SignUpActionResponse> {
  const { success, data: parsedData } = UserZodSchema.safeParse(data);
  if (!success) {
    return {
      success: false,
      message: "Invalid data",
    };
  }
  try {
    const user = await createUser({
      email: parsedData.email,
      password: parsedData.password,
      name: parsedData.name,
    });
    await createSession(user.id);
    return {
      user,
      success: true,
      message: "Successfully signed up",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sign up",
    };
  }
}
