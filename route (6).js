import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";

function authorized(request) {
  const username = request.headers.get("x-admin-username");
  const password = request.headers.get("x-admin-password");
  const secret = request.headers.get("x-admin-secret");

  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD &&
    secret === process.env.ADMIN_SECRET
  );
}

export async function GET(request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = await getDb();
    const batches = await db.collection("batches").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(batches);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await request.json();
    const db = await getDb();
    const doc = {
      id: String(data.id || crypto.randomUUID()),
      name: String(data.name || "New Batch").slice(0, 150),
      image: String(data.image || ""),
      description: String(data.description || ""),
      teacher: String(data.teacher || ""),
      language: String(data.language || ""),
      price: String(data.price || "Free"),
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      content: Array.isArray(data.content) ? data.content : [],
      createdAt: new Date()
    };
    await db.collection("batches").updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: "Could not save batch." }, { status: 500 });
  }
}
