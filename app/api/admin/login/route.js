import { NextResponse } from "next/server";

export async function POST(request) {
  const { username, password } = await request.json();
  const ok =
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD;

  if (!ok) return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });

  return NextResponse.json({
    ok: true,
    admin: {
      username: process.env.ADMIN_USERNAME,
      gmail: process.env.ADMIN_GMAIL || ""
    }
  });
}
