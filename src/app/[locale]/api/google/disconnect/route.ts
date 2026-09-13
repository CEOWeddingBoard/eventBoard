export async function POST() {
  return new Response("Google Calendar integration is disabled", { status: 404 });
}
