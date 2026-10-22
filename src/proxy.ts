import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Home invokes Server Actions through the JS client (Next-Action header).
  // It has no native multipart forms. Reject unsupported form submissions
  // before Next tries to decode their action IDs and throws a render error.
  if (
    request.nextUrl.pathname === "/" &&
    request.method === "POST" &&
    !request.headers.has("next-action") &&
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("multipart/form-data")
  ) {
    return new NextResponse("Unsupported form submission.", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.next();
}

export const config = { matcher: "/" };
