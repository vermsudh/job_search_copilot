import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  // Validate Supabase session — guards against public abuse of Gemini credits.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const text: string = body?.text ?? "";
  if (!text.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Extract the job title and company name from the following job description text.
Return ONLY valid JSON with exactly two fields: "title" and "company". No markdown, no explanation.

Job description:
${text.slice(0, 4000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      title: parsed.title ?? "",
      company: parsed.company ?? "",
    });
  } catch (err) {
    console.error("[parse-job]", err);
    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 500 },
    );
  }
}
