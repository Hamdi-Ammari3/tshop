import { NextResponse }
from "next/server";

export function middleware(
  request
) {

  const host =
    request.headers.get(
      "host"
    );

  const url =
    request.nextUrl.clone();

  const hostname =
    host?.split(":")[0];

  /*
  LOCALHOST
  */
  if (
    hostname === "localhost"
  ) {

    return NextResponse.next();

  }

  const parts =
    hostname.split(".");

  /*
  SUBDOMAIN
  */
  if (parts.length > 2) {

    const subdomain =
      parts[0];

    if (
      subdomain !== "www"
    ) {

      /*
      KEEP ORIGINAL PATH
      */
      url.pathname =
        `/store/${subdomain}${url.pathname}`;

      return NextResponse.rewrite(
        url
      );

    }

  }

  return NextResponse.next();

}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico).*)",
  ],
};