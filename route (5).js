import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

function authorized(request) {
  return (
    request.headers.get("x-admin-username") === process.env.ADMIN_USERNAME &&
    request.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD &&
    request.headers.get("x-admin-secret") === process.env.ADMIN_SECRET
  );
}

export async function DELETE(request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    const db = await getDb();
    await db.collection("community").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete message." }, { status: 400 });
  }
}
