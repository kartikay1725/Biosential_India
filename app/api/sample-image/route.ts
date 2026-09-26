import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Find a real test fauna image
    const candidatePath = path.join(
      process.cwd(),
      "data",
      "raw",
      "inaturalist",
      "images",
      "test",
      "329TJ__Cucumis_maderaspatanus",
      "3070512098__001ada7bdfc5.jpg"
    );

    if (fs.existsSync(candidatePath)) {
      const buffer = fs.readFileSync(candidatePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": "inline; filename=sample_observation.jpg",
        },
      });
    }

    return NextResponse.json({ error: "Sample image not found" }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
