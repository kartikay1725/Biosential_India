import { NextResponse } from "next/server";
import { getMapPoints } from "@/lib/api/data-service";

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/points", { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  return NextResponse.json(getMapPoints());
}
