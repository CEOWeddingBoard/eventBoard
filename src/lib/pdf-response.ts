import { NextResponse } from "next/server";

/** Next.js 15 BodyInit typing – Buffer/Uint8Array z pdf-lib. */
export function pdfBinaryResponse(
  buffer: Uint8Array | Buffer,
  headers: Record<string, string>,
): NextResponse {
  const body = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
  return new NextResponse(body, {
    status: 200,
    headers: {
      ...headers,
      "Content-Length": String(body.byteLength),
    },
  });
}
