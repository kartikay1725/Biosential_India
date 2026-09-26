import { NextResponse } from "next/server";
import { getSystemSummary } from "@/lib/api/data-service";

export async function GET() {
  try {
    // Try live FastAPI backend first
    const res = await fetch("http://127.0.0.1:8000/api/summary", { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  // Fallback to local data service
  return NextResponse.json(getSystemSummary());
}
