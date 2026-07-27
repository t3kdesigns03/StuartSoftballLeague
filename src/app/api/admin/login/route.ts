import { NextResponse } from "next/server";

import { ADMIN_COOKIE, adminToken, isValidPassword } from "@/lib/adminAuth";

export async function POST(request: Request) {
  let password = "";
  try {
    ({ password = "" } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    // Small delay to blunt brute-force attempts.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
