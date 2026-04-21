import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NAME_LENGTH = 100;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function authorize(request: NextRequest): boolean {
  const expected = process.env.ANALYTICS_API_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  const [scheme, value] = header.split(" ");
  return scheme === "Bearer" && typeof value === "string" && value === expected;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    console.warn("analytics:GET unauthorized", { ip: request.headers.get("x-forwarded-for") });
    return unauthorized();
  }

  const userId = request.nextUrl.searchParams.get("userId") ?? "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  // DB access intentionally omitted here. When wired up, use a parameterised
  // query (e.g. db.query("SELECT id FROM users WHERE id = $1", [userId])).
  return NextResponse.json({ data: [] });
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    console.warn("analytics:POST unauthorized", { ip: request.headers.get("x-forwarded-for") });
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const rawName = (body as { name?: unknown }).name;
  if (typeof rawName !== "string" || rawName.length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const name = rawName.slice(0, MAX_NAME_LENGTH);

  return NextResponse.json({ message: `Welcome ${name}` });
}
