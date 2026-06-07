import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Require auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a valid PDF file." },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF must be under 5 MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // pdf-parse@1 is CJS; dynamic import returns the function as .default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import("pdf-parse") as any;
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
      typeof mod.default === "function" ? mod.default : mod;
    const data = await pdfParse(buffer);

    const text = data.text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n") // collapse excessive blank lines
      .trim();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[parse-resume]", err);
    return NextResponse.json(
      { error: "Failed to extract text from PDF." },
      { status: 500 },
    );
  }
}
