import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function POST(request) {
  try {
    const { visitorId, batchId } = await request.json();
    if (!visitorId || !batchId) return NextResponse.json({ error: "Missing data." }, { status: 400 });

    const db = await getDb();
    await db.collection("enrollments").updateOne(
      { visitorId, batchId: String(batchId) },
      { $setOnInsert: { visitorId, batchId: String(batchId), createdAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save enrollment." }, { status: 503 });
  }
}