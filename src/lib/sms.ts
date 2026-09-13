import { Guest } from "@prisma/client";

// Simple Twilio-based SMS service with safe fallback when not configured.

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

type TwilioClient = {
  messages: { create: (opts: { body: string; from: string; to: string }) => Promise<{ sid: string }> };
};

let twilioClient: TwilioClient | null = null;

function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!twilioClient) {
    // Ładowane leniwie: twilio ciągnie `crypto` i `stream`, więc statyczny
    // import wciągnąłby je do każdego bundla, który dotyka tego modułu.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy load, patrz wyżej
    const twilio = require("twilio") as (sid: string, token: string) => TwilioClient;
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export function isSmsConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; sid?: string }> {
  const client = getTwilioClient();
  if (!client || !TWILIO_FROM_NUMBER) {
    // eslint-disable-next-line no-console
    console.warn("[sms] Twilio is not configured. Skipping SMS send.", { to, preview: body.slice(0, 60) });
    return { ok: false };
  }

  try {
    const res = await client.messages.create({
      from: TWILIO_FROM_NUMBER,
      to,
      body,
    });
    return { ok: true, sid: res.sid };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[sms] Failed to send SMS", { to, error });
    return { ok: false };
  }
}

export function buildBulkSmsPreview(guests: Pick<Guest, "id" | "name" | "phone">[], message: string) {
  const withPhone = guests.filter((g) => g.phone);
  return {
    total: guests.length,
    withPhone: withPhone.length,
    sampleRecipients: withPhone.slice(0, 3).map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
    })),
    messagePreview: message.slice(0, 120),
  };
}

