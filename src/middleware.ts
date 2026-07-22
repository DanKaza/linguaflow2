import { createClient } from "@/utils/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/a/dashboard",
  guru: "/g/dashboard",
  murid: "/m/dashboard",
};

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/", "/login", "/register", "/register-sekolah"];
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicFile = pathname.startsWith("/_next/") || pathname.startsWith("/favicon");
  const isPublicRoute = publicRoutes.some((r) => pathname === r) || isApiRoute || isPublicFile;

  // Not authenticated → redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user
  if (user) {
    // Cek role dari database
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Jika di halaman login, redirect ke dashboard sesuai role
    if (pathname === "/login" || pathname === "/" || pathname === "/register") {
      const redirectTo = role ? ROLE_REDIRECTS[role] || "/m/dashboard" : "/m/dashboard";
      const url = request.nextUrl.clone();
      url.pathname = redirectTo;
      return NextResponse.redirect(url);
    }

    // Cegah akses ke role lain (contoh: murid akses /g/dashboard)
    if (role) {
      const rolePrefix = `/${role}/`;
      // Protected: admin can access everything, others only their own prefix
      if (role !== "admin" && pathname.startsWith("/a/")) {
        const url = request.nextUrl.clone();
        url.pathname = ROLE_REDIRECTS[role] || "/m/dashboard";
        return NextResponse.redirect(url);
      }
      if (role === "murid" && (pathname.startsWith("/g/") || pathname.startsWith("/a/"))) {
        const url = request.nextUrl.clone();
        url.pathname = "/m/dashboard";
        return NextResponse.redirect(url);
      }
      if (role === "guru" && pathname.startsWith("/m/")) {
        // Guru boleh lihat halaman murid? Mungkin ya untuk preview, kita izinkan dulu
        // Tapi tidak boleh akses admin
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)",
  ],
};
