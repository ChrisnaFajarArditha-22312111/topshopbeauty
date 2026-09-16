import { NextResponse, type NextRequest } from "next/server";

// Route yang membutuhkan autentikasi
const protectedRoutes = ["/profile", "/addresses", "/orders", "/checkout"];
const adminRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("topshop_access_token")?.value;

  // Cek apakah route terlindungi
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (isProtected || isAdmin) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Jika sudah login dan mencoba mengakses /login atau /register
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/addresses/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
