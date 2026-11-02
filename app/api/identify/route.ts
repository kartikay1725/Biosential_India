import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/config/backend";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const year = req.nextUrl.searchParams.get("year") || "2024";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const backendUrl = getBackendUrl();

    // Forward to live Python FastAPI backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendRes = await fetch(`${backendUrl}/api/identify?year=${year}`, {
      method: "POST",
      body: backendFormData,
    }).catch(() => null);

    if (!backendRes) {
      return NextResponse.json(
        {
          error: `BioCLIP inference service is unreachable at ${backendUrl}. If running on Vercel, please ensure BACKEND_URL environment variable is set to your active ML backend.`,
        },
        { status: 503 }
      );
    }

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
