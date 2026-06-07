import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import type { KitData } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const kitSchema = {
  type: SchemaType.OBJECT,
  properties: {
    coverLetter: { type: SchemaType.STRING },
    resumeBullets: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    interviewQuestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    companyBrief: { type: SchemaType.STRING },
  },
  required: ["coverLetter", "resumeBullets", "interviewQuestions", "companyBrief"],
};

export async function POST(req: NextRequest) {
  // Validate session — protects Gemini credits from unauthenticated callers.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const jobId: string = body?.jobId ?? "";
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  // Re-read job + profile server-side so the prompt can't be tampered with client-side.
  const [jobResult, profileResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", user.id).single(),
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
  ]);

  if (jobResult.error || !jobResult.data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const job = jobResult.data;
  const profile = profileResult.data;
  const resumeText = profile?.resume_text?.trim() || "(No resume provided — generate generically)";
  const candidateName = profile?.full_name || "the candidate";

  const prompt = `You are an expert career coach helping ${candidateName} apply for a job.

CANDIDATE RESUME:
${resumeText.slice(0, 6000)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description:
${job.description.slice(0, 4000)}

Generate a tailored application kit with these four sections:

1. coverLetter: A professional, personalized cover letter (3-4 paragraphs) that highlights relevant experience from the resume and shows genuine interest in the company and role.

2. resumeBullets: 5 rewritten resume bullet points from the candidate's experience, optimized with strong action verbs and quantified results where possible, specifically tailored to match keywords and requirements from this job posting.

3. interviewQuestions: 5 likely interview questions for this specific role at this company, including at least one behavioral and one technical question relevant to the posting.

4. companyBrief: A concise one-page (250-350 words) brief about the company — what they do, their mission, recent news or products, culture signals from the posting, and why this is a compelling place to work.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: kitSchema as never,
      },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = JSON.parse(raw) as Omit<KitData, "generatedAt">;

    const kit: KitData = {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };

    // Persist the kit back to the job row.
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ kit })
      .eq("id", jobId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[generate-kit] DB update error:", updateError);
    }

    return NextResponse.json({ kit });
  } catch (err) {
    console.error("[generate-kit]", err);
    return NextResponse.json(
      { error: "Kit generation failed" },
      { status: 500 },
    );
  }
}
