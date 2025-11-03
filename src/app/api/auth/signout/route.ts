import { NextResponse } from "next/server";
import { signOut } from "auth/server";

export async function POST() {
  await signOut();
  return NextResponse.json({ success: true });
}
