import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret"
);

const COOKIE_NAMES = {
  customer: "badro_customer_session",
  staff: "badro_staff_session",
  company: "badro_company_session",
};

async function isAuthenticated(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(COOKIE_NAMES.staff)?.value;
    if (!(await isAuthenticated(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/panel") && pathname !== "/panel/login") {
    const token = request.cookies.get(COOKIE_NAMES.customer)?.value;
    if (!(await isAuthenticated(token))) {
      return NextResponse.redirect(new URL("/panel/login", request.url));
    }
  }

  if (pathname.startsWith("/company") && pathname !== "/company/login") {
    const token = request.cookies.get(COOKIE_NAMES.company)?.value;
    if (!(await isAuthenticated(token))) {
      return NextResponse.redirect(new URL("/company/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/panel/:path*", "/company/:path*"],
};
