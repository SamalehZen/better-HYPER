export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { signIn } from "auth/server";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 },
    );
  }

  const session = await signIn(email, password);

  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ success: true, user: session.user });
}
