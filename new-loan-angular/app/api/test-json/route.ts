import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  try {
    // `process.cwd()` is `<repo>/new-loan` when running Next from this app.
    // Root `test.json` lives one directory up: `<repo>/test.json`.
    const filePath = path.join(process.cwd(), "..", "test.json");
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return NextResponse.json(parsed, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to read root test.json", message },
      { status: 500 }
    );
  }
}

