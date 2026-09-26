import { NextRequest, NextResponse } from "next/server";
import { getGridRecord, getCaseStudy } from "@/lib/api/data-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cell: string }> }
) {
  const { cell } = await params;
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/grid/${cell}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  const record = getGridRecord(cell);
  if (!record) {
    return NextResponse.json({ error: `Grid ${cell} not found` }, { status: 404 });
  }

  const trajectory = getCaseStudy(cell);
  return NextResponse.json({ record, trajectory });
}
