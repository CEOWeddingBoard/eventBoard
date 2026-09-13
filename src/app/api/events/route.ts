// This API route is deprecated. Use Server Actions instead.
export async function GET() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
export async function POST() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
