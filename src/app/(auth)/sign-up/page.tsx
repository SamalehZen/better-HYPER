import SignUpPage from "@/components/auth/sign-up";
import { getAuthConfig } from "auth/config";
import { getIsFirstUser } from "lib/auth/server";
import { redirect } from "next/navigation";

export default async function SignUp() {
  const isFirstUser = await getIsFirstUser();
  const { emailAndPasswordEnabled, signUpEnabled } = getAuthConfig();

  if (!signUpEnabled) {
    redirect("/sign-in");
  }
  return (
    <SignUpPage
      isFirstUser={isFirstUser}
      emailAndPasswordEnabled={emailAndPasswordEnabled}
    />
  );
}
