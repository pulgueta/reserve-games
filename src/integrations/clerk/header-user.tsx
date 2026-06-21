import { SignInButton, UserButton, useAuth } from "@clerk/react";

export default function HeaderUser() {
  const { isSignedIn } = useAuth();

  return isSignedIn ? <UserButton /> : <SignInButton />;
}
