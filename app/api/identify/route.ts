import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Forward to live Python FastAPI backend on port 8000
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendRes = await fetch("http://127.0.0.1:8000/api/identify", {
      method: "POST",
      body: backendFormData,
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return NextResponse.json(
        { error: `Backend inference error: ${errText}` },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Identify API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process image identification" },
      { status: 500 }
    );
  }
}
