import { NextRequest, NextResponse } from "next/server";
import { getSpeciesForGrid } from "@/lib/api/data-service";
import { getBackendUrl } from "@/lib/config/backend";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cell: string }> }
) {
  const { cell } = await params;
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/species/${cell}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  const list = getSpeciesForGrid(cell);
  return NextResponse.json(list);
}
