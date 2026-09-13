export async function GET() {
  return new Response("Google Calendar integration is disabled", { status: 404 });
}
