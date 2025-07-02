export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Paste your entire schema into this template string ---


export async function POST(req: Request) {
  console.log("=== /api/agent POST invoked ===");

  // 1) Parse body
  let body: any;
  try {
    body = await req.json();
    console.log("✔️ Parsed JSON body:", body);
  } catch (err: any) {
    console.error("❌ JSON parse error:", err);
    return NextResponse.json(
      { error: "Invalid JSON", details: err.message },
      { status: 400 }
    );
  }

  const { message } = body;
  if (!message) {
    console.warn("⚠️ No “message” field");
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }
  console.log("📩 User message:", message);

  // 2) Build a prompt that asks for supabase-js code
  const prompt = `
You are a Supabase-JS expert.  
Given the following database schema:
\`\`\`sql
${SCHEMA}
\`\`\`
Generate a JavaScript code snippet using supabase-js (v2) that implements exactly the query described below.
- Do not include any SQL.
- Use only the official supabase-js client (assume it’s already initialized as \`const supabase\`).  
- Return only the JavaScript code (no commentary).

Query:
"${message}"
`;

  console.log("📝 Prompting OpenAI with:\n", prompt);

  // 3) Call OpenAI
  let code: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a Supabase-JS expert." },
        { role: "user", content: prompt },
      ],
    });
    code = completion.choices[0].message.content.trim();
    console.log("✅ Received code from OpenAI:\n", code);
  } catch (err: any) {
    console.error("❌ OpenAI API error:", err);
    return NextResponse.json(
      { error: "OpenAI API error", details: err.message },
      { status: 502 }
    );
  }

  // 4) Return the generated code
  return NextResponse.json({ code });
}
