import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie and gates /cont and /admin (optimistic check only;
// real authorization is enforced by RLS and by server-side checks in each page).
export async function proxy(request: NextRequest) {
  // /en/... is served by the same routes: rewrite to the unprefixed path and tell the app which language to render.
  const rawPath = request.nextUrl.pathname;
  const isEn = rawPath === "/en" || rawPath.startsWith("/en/");
  const target = request.nextUrl.clone();
  if (isEn) target.pathname = rawPath === "/en" ? "/" : rawPath.slice(3);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", isEn ? "en" : "ro");
  const forward = () => (isEn ? NextResponse.rewrite(target, { request: { headers: requestHeaders } }) : NextResponse.next({ request: { headers: requestHeaders } }));
  let response = forward();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
          response = forward();
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const path = target.pathname;
  const inArea = (base: string) => path === base || path.startsWith(`${base}/`);
  const protectedPath = inArea("/cont") || inArea("/admin");

  if (protectedPath && !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = isEn ? "/en/autentificare" : "/autentificare";
    url.searchParams.set("next", rawPath);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
