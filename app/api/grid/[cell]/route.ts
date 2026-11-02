import { NextRequest, NextResponse } from "next/server";
import { getGridRecord, getCaseStudy } from "@/lib/api/data-service";
import { getBackendUrl } from "@/lib/config/backend";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cell: string }> }
) {
  const { cell } = await params;
  const yearStr = req.nextUrl.searchParams.get("year");
  const year = yearStr ? Number(yearStr) : 2024;

  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/grid/${cell}?year=${year}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  const record = getGridRecord(cell, year);
  if (!record) {
    return NextResponse.json({ error: `Grid ${cell} not found for year ${year}` }, { status: 404 });
  }

  const trajectory = getCaseStudy(cell);
  return NextResponse.json({ record, trajectory });
}
