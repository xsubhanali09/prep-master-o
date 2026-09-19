import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function POST(request) {
  try {
    const { visitorId } = await request.json();
    if (!visitorId) return NextResponse.json({ error: "Missing visitor id." }, { status: 400 });

    const db = await getDb();
    const rows = await db.collection("enrollments").find({ visitorId }).toArray();
    const ids = rows.map((r) => r.batchId);
    const batches = await db.collection("batches").find({ id: { $in: ids } }).toArray();
    return NextResponse.json(batches);
  } catch {
    return NextResponse.json({ error: "Database not configured or unavailable." }, { status: 503 });
  }
}
