import { NextResponse } from "next/server";

/** Next.js 15 BodyInit typing – Buffer/Uint8Array z pdf-lib. */
export function pdfBinaryResponse(
  buffer: Uint8Array | Buffer,
  headers: Record<string, string>,
): NextResponse {
  // Kopia do bufora typu ArrayBuffer — BodyInit nie przyjmuje widoku nad
  // SharedArrayBuffer, a tym właśnie jest ogólny Uint8Array<ArrayBufferLike>.
  const body = new Uint8Array(buffer.byteLength);
  body.set(buffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      ...headers,
      "Content-Length": String(body.byteLength),
    },
  });
}
