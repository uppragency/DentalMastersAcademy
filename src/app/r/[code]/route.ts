import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20).toUpperCase();
  const res = NextResponse.redirect(new URL("/cursuri", request.url));
  if (clean) res.cookies.set("dma_ref", clean, { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax", httpOnly: true, secure: true });
  return res;
}
