import { NextRequest, NextResponse } from "next/server";
import { getSpeciesForGrid } from "@/lib/api/data-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cell: string }> }
) {
  const { cell } = await params;
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/species/${cell}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  const list = getSpeciesForGrid(cell);
  return NextResponse.json(list);
}
