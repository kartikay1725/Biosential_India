import { NextRequest, NextResponse } from "next/server";
import { getTopPriorityUnits } from "@/lib/api/data-service";
import { getBackendUrl } from "@/lib/config/backend";

export async function GET(req: NextRequest) {
  const yearStr = req.nextUrl.searchParams.get("year");
  const year = yearStr ? Number(yearStr) : 2024;
  const limitStr = req.nextUrl.searchParams.get("limit");
  const limit = limitStr ? Number(limitStr) : 186;

  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/priority?year=${year}&limit=${limit}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  return NextResponse.json(getTopPriorityUnits(year, limit));
}
