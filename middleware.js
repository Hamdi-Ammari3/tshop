import { NextResponse } from "next/server";

export function middleware(request) {

    const host = request.headers.get("host");

    const url = request.nextUrl.clone();

    const hostname = host?.split(":")[0];

  if (
    hostname === "localhost"
  ) {
    return NextResponse.next();
  }

  const parts =
    hostname.split(".");

  if (parts.length > 2) {

    const subdomain =
      parts[0];

    if (
      subdomain !== "www"
    ) {

      url.pathname =
        `/store/${subdomain}`;

      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico).*)",
  ],
};