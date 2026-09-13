"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM || "wedding-planner@twojewesele.app";

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function scheduleTaskReminder(taskId: string): Promise<void> {
  if (!resend) {
    console.warn("[notification-service] Resend not configured, skipping task reminder.");
    return;
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      title: true,
      dueDate: true,
      assigneeRole: true,
      event: { select: { name: true, partnerEmail: true, brideName: true, groomName: true } },
    },
  });

  if (!task || !task.dueDate || !task.event) return;

  const recipientEmail = task.event.partnerEmail;
  if (!recipientEmail) return;

  const dueLabel = task.dueDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const eventName = task.event.name || "Wesele";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Przypomnienie o zadaniu — ${eventName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #4a5d3e;">Przypomnienie o zadaniu</h2>
          <p>Masz zadanie do wykonania w ramach przygotowań do <strong>${eventName}</strong>:</p>
          <div style="background: #f5f3ee; padding: 16px 20px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; color: #2d3824;">${task.title}</h3>
            <p style="margin: 0; color: #4a5c3e;">Termin: <strong>${dueLabel}</strong></p>
            ${task.assigneeRole ? `<p style="margin: 4px 0 0; color: #8f7a45;">Przypisane do: ${task.assigneeRole}</p>` : ""}
          </div>
          <p style="color: #aaa; font-size: 12px;">Wiadomość wygenerowana automatycznie przez Wedding Planner.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[notification-service] Failed to send task reminder:", error);
  }
}

export async function sendRsvpReminder(eventId: string, guestId: string): Promise<void> {
  if (!resend) {
    console.warn("[notification-service] Resend not configured, skipping RSVP reminder.");
    return;
  }

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: {
      name: true,
      email: true,
      event: {
        select: {
          name: true,
          date: true,
          publicSlug: true,
          partnerEmail: true,
        },
      },
    },
  });

  if (!guest || !guest.email || !guest.event) return;

  const guestEmail = guest.email;
  const rsvpUrl = guest.event.publicSlug
    ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/rsvp/${guest.event.publicSlug}`
    : null;

  const eventName = guest.event.name || "Wesele";
  const weddingDate = guest.event.date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: guestEmail,
      subject: `Potwierdź swoją obecność — ${eventName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #4a5d3e;">Droga/Drogi ${guest.name}!</h2>
          <p>Zbliża się <strong>${eventName}</strong> (${weddingDate}).</p>
          <p>Będziemy wdzięczni za potwierdzenie Twojej obecności. Kliknij poniższy przycisk, aby odpowiedzieć na zaproszenie:</p>
          ${rsvpUrl
            ? `<a href="${rsvpUrl}" style="display: inline-block; background: #4a5d3e; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Potwierdź obecność</a>`
            : `<p style="color: #888;">Skontaktuj się z organizatorami, aby potwierdzić obecność.</p>`
          }
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Wiadomość wygenerowana automatycznie przez Wedding Planner.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[notification-service] Failed to send RSVP reminder:", error);
  }
}

export async function sendMilestoneNotification(eventId: string, milestone: string): Promise<void> {
  if (!resend) {
    console.warn("[notification-service] Resend not configured, skipping milestone notification.");
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, partnerEmail: true, date: true },
  });

  if (!event || !event.partnerEmail) return;

  const eventName = event.name || "Wesele";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: event.partnerEmail,
      subject: `${milestone} — ${eventName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #4a5d3e;">${milestone}!</h2>
          <p>Do Waszego ślubu pozostało <strong>${milestone}</strong>!</p>
          <p>To świetny moment, aby sprawdzić postępy w przygotowaniach i zająć się zaległymi zadaniami.</p>
          <p style="color: #8f7a45; font-style: italic;">Cieszcie się każdą chwilą przygotowań!</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Wiadomość wygenerowana automatycznie przez Wedding Planner.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[notification-service] Failed to send milestone notification:", error);
  }
}

export async function sendVendorPaymentReminder(vendorId: string): Promise<void> {
  if (!resend) {
    console.warn("[notification-service] Resend not configured, skipping vendor payment reminder.");
    return;
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      name: true,
      category: true,
      event: {
        select: { name: true, partnerEmail: true },
      },
    },
  });

  if (!vendor || !vendor.event?.partnerEmail) return;

  const eventName = vendor.event.name || "Wesele";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: vendor.event.partnerEmail,
      subject: `Przypomnienie o płatności dla dostawcy — ${vendor.name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #4a5d3e;">Przypomnienie o płatności</h2>
          <p>Zbliża się termin płatności dla dostawcy w ramach <strong>${eventName}</strong>:</p>
          <div style="background: #f5f3ee; padding: 16px 20px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; color: #2d3824;">${vendor.name}</h3>
            <p style="margin: 0; color: #4a5c3e;">Kategoria: <strong>${vendor.category}</strong></p>
          </div>
          <p>Sprawdź szczegóły w panelu i ureguluj płatność przed terminem.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Wiadomość wygenerowana automatycznie przez Wedding Planner.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[notification-service] Failed to send vendor payment reminder:", error);
  }
}
