import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const messages = await db.collection("community").find({}).sort({ createdAt: 1 }).limit(200).toArray();
    return NextResponse.json(messages.map(({ _id, ...m }) => ({ id: _id.toString(), ...m })));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const { visitorId, username, text } = await request.json();
    const clean = String(text || "").trim();
    if (!visitorId || !clean || clean.length > 1000) {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }

    const db = await getDb();
    const doc = {
      visitorId: String(visitorId),
      username: String(username || "Student").slice(0, 40),
      text: clean,
      createdAt: new Date()
    };
    const result = await db.collection("community").insertOne(doc);
    return NextResponse.json({ id: result.insertedId.toString(), ...doc });
  } catch {
    return NextResponse.json({ error: "Could not send message." }, { status: 503 });
  }
}
