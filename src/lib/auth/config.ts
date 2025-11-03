import { parseEnvBoolean } from "../utils";

export function getAuthConfig() {
  return {
    emailAndPasswordEnabled: process.env.DISABLE_EMAIL_SIGN_IN
      ? !parseEnvBoolean(process.env.DISABLE_EMAIL_SIGN_IN)
      : true,
    signUpEnabled: process.env.DISABLE_SIGN_UP
      ? !parseEnvBoolean(process.env.DISABLE_SIGN_UP)
      : true,
  } as const;
}
