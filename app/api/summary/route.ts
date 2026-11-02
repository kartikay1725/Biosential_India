import { NextRequest, NextResponse } from "next/server";
import { getSystemSummary } from "@/lib/api/data-service";
import { getBackendUrl } from "@/lib/config/backend";

export async function GET(req: NextRequest) {
  const yearStr = req.nextUrl.searchParams.get("year");
  const year = yearStr ? Number(yearStr) : 2024;

  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/summary?year=${year}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  return NextResponse.json(getSystemSummary(year));
}
