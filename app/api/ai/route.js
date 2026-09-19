import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured yet. Add OPENAI_API_KEY on the server." }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const safeMessages = Array.isArray(messages)
      ? messages.slice(-20).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 6000)
        }))
      : [];

    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions:
        "You are Prep Master AI, a study assistant. Answer educational questions clearly and accurately. " +
        "Support the user's language when possible, including Hindi, Hinglish and English. " +
        "If asked your name, say your name is Prep Master AI. Do not claim to be a human. " +
        "For schoolwork, prefer step-by-step explanations and exam-friendly wording.",
      input: safeMessages
    });

    return NextResponse.json({ reply: response.output_text });
  } catch {
    return NextResponse.json({ error: "AI request failed." }, { status: 500 });
  }
}
