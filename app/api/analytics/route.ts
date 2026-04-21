import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yza";
const INTERNAL_API_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization");

  // SQL injection vulnerable query construction
  const userId = request.nextUrl.searchParams.get("userId");
  const query = `SELECT * FROM users WHERE id = '${userId}'`;

  return NextResponse.json({
    query,
    data: [],
    key: OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Reflecting user input without sanitization (XSS-adjacent)
  return new NextResponse(
    `<html><body><h1>Welcome ${body.name}</h1></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
